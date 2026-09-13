// Captures every route at three widths, so a refactor can be shown not to have
// changed what the site looks like.
//
// There are no tests in this repo, which makes "nothing moved" an assertion
// nobody can check. This turns it into an artefact: shoot once before a change,
// once after, and compare.
//
//   node scripts/shoot.mjs before      capture into shots/before
//   node scripts/shoot.mjs after       capture into shots/after
//   node scripts/shoot.mjs --compare before after
//
// Needs a build first (`npm run build`) — it serves the static export rather
// than `next dev`, so no HMR client or dev overlay lands in the picture.
// Playwright is not a dependency of this project; it is taken from the project
// if it happens to be there and from the global root otherwise.
//
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "out");
const SHOTS = join(ROOT, "shots");

const ROUTES = [
  ["dashboard", "/"],
  ["mortgage", "/mortgage/"],
  ["income", "/income/"],
  ["expenses", "/expenses/"],
  ["retirement", "/retirement/"],
];

// 390 catches the phone layout and, with it, the vertical timeline and the
// stacked item rows. 900 is the awkward middle: the `max-width: 900px` rules
// still apply at exactly 900, while the dashboard's `min-width: 640px` grid
// has already kicked in. 1440 is past the 1100px breakpoints, where the grid
// widens to four columns and the page gutter opens up.
const WIDTHS = [390, 900, 1440];

// The seed data is anchored to SEED_MONTH and moved onto the real clock after
// mount (see useClockDefaults), so an unfrozen clock re-dates every figure on
// the page and the shots stop comparing. Frozen to the day the baseline was
// first taken.
const FROZEN_CLOCK = new Date("2026-09-12T12:00:00Z");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
};

/**
 * Playwright is deliberately not a dependency of this project — it would be a
 * large install for a script nothing in the build depends on. So take it from
 * wherever it is: the project first, then the global root. ESM resolution
 * ignores NODE_PATH, which is why this resolves a path rather than importing a
 * bare name.
 */
async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const roots = [];
  try {
    roots.push(execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim());
  } catch {
    // npm not on PATH; the bare import below is still worth a try.
  }
  // Playwright is CommonJS, so a file-URL import lands the exports on
  // `default` rather than as named ones.
  const unwrap = (mod) => (mod?.chromium ? mod : mod?.default);
  for (const root of roots) {
    try {
      const mod = unwrap(
        await import(pathToFileURL(require.resolve("playwright", { paths: [root] })).href),
      );
      if (mod?.chromium) return mod;
    } catch {
      // Not under this root; fall through.
    }
  }
  try {
    const mod = unwrap(await import("playwright"));
    if (mod?.chromium) return mod;
  } catch {
    // Fall through to the message below.
  }
  console.error(
    "playwright not found. Install it (npm i -D playwright) or globally (npm i -g playwright).",
  );
  process.exit(1);
}

function serve(dir) {
  const server = createServer(async (req, res) => {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    // `trailingSlash: true` in next.config.mjs means the export writes
    // `/mortgage/index.html`, which a directory request has to resolve to.
    if (path.endsWith("/")) path += "index.html";
    const file = join(dir, path);
    if (!file.startsWith(dir)) {
      res.writeHead(403).end();
      return;
    }
    try {
      await stat(file);
    } catch {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

async function capture(label) {
  const { chromium } = await loadPlaywright();

  try {
    await stat(join(OUT, "index.html"));
  } catch {
    console.error("no build in out/ — run `npm run build` first");
    process.exit(1);
  }

  const dir = join(SHOTS, label);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const server = await serve(OUT);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();

  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
      // globals.css zeroes every transition and animation under this, and
      // useReducedMotion drops the JS tweens to a snap — so a shot is of the
      // settled page rather than whatever frame it was caught on.
      reducedMotion: "reduce",
    });
    await context.clock.install({ time: FROZEN_CLOCK });

    for (const [name, route] of ROUTES) {
      const page = await context.newPage();
      await page.goto(origin + route, { waitUntil: "networkidle" });
      // Web fonts change every metric on the page; a shot taken before they
      // land is of the fallback stack.
      await page.evaluate(() => document.fonts.ready.then(() => true));
      await page.screenshot({ path: join(dir, `${name}-${width}.png`), fullPage: true });
      await page.close();
    }
    await context.close();
  }

  await browser.close();
  server.close();
  await report(label);
}

async function digest(dir) {
  const names = (await readdir(dir)).filter((n) => n.endsWith(".png")).sort();
  const out = new Map();
  for (const name of names) {
    const bytes = await readFile(join(dir, name));
    out.set(name, { sum: createHash("sha256").update(bytes).digest("hex"), size: bytes.length });
  }
  return out;
}

async function report(label) {
  const sums = await digest(join(SHOTS, label));
  console.log(`\n${label} — ${sums.size} shots`);
  for (const [name, { sum, size }] of sums) {
    console.log(
      `  ${name.padEnd(24)} ${(size / 1024).toFixed(0).padStart(5)} KB  ${sum.slice(0, 12)}`,
    );
  }
}

async function compare(a, b) {
  const [left, right] = [await digest(join(SHOTS, a)), await digest(join(SHOTS, b))];
  const names = [...new Set([...left.keys(), ...right.keys()])].sort();
  let changed = 0;
  for (const name of names) {
    const l = left.get(name);
    const r = right.get(name);
    if (!l || !r) {
      console.log(`  ${!l ? "ONLY IN " + b : "ONLY IN " + a}  ${name}`);
      changed++;
    } else if (l.sum !== r.sum) {
      console.log(`  CHANGED  ${name}  (${l.size} -> ${r.size} bytes)`);
      changed++;
    }
  }
  console.log(
    changed === 0
      ? `\n${names.length} shots, all identical: ${a} and ${b} render the same.`
      : `\n${changed} of ${names.length} shots differ. Open both and look before calling it expected.`,
  );
  process.exitCode = changed === 0 ? 0 : 1;
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "--compare") {
  if (rest.length !== 2) {
    console.error("usage: node scripts/shoot.mjs --compare <before> <after>");
    process.exit(1);
  }
  await compare(rest[0], rest[1]);
} else if (cmd) {
  await capture(cmd);
} else {
  console.error("usage: node scripts/shoot.mjs <label> | --compare <before> <after>");
  process.exit(1);
}
