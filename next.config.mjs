/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a fully static site into `out/` so it can be served from S3/CloudFront
  // with no Node server. Nothing here fetches, sets cookies, or reads the
  // request, so every route prerenders at build time.
  output: "export",
  // Emits `/mortgage/index.html` instead of `/mortgage.html`. S3 resolves a
  // directory request to its index document on its own, so this is what makes
  // the routes work without per-route rewrite rules.
  trailingSlash: true,
  // `next dev` only serves its client chunks and HMR socket to origins it
  // trusts; a LAN address isn't trusted by default, so the page renders but
  // never hydrates. These cover the usual private-network ranges so a new
  // DHCP lease doesn't break it again.
  allowedDevOrigins: ["192.168.0.108", "192.168.*.*", "10.*.*.*", "172.16.*.*"],
};

export default nextConfig;
