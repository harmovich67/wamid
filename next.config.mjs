/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Reuse a visited page for 30s when going back and forth between tabs, instead of re-rendering
    // it on the server every time. Any mutation calls router.refresh(), which clears this cache.
    // Fully prefetched pages (the main nav links) are reused for 60s instead of the default 5 minutes.
    staleTimes: { dynamic: 30, static: 60 },
    // Tree-shake barrel imports that aren't on Next's default list (lucide-react already is).
    optimizePackageImports: ["motion", "@tiptap/react", "@tiptap/extensions"],
  },
  async headers() {
    return [
      {
        // The service worker must never be served stale, or notification fixes won't reach users.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
