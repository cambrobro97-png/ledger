"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TOOLS } from "@/lib/tools";

/**
 * The site has no landing page of its own — `/` just hands off to the first
 * tool. A static export has no server to issue a 3xx, so the redirect runs on
 * the client after hydration. `replace` keeps `/` out of the history stack, so
 * Back from the first tool leaves the site instead of bouncing here again.
 */
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace(TOOLS[0].href);
  }, [router]);

  return null;
}
