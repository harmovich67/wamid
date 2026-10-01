export default function manifest() {
  return {
    name: "وَمِيض · Wameed",
    short_name: "وَمِيض",
    description: "أكاديمية برمجة تفاعلية من الصفر إلى الاحتراف",
    start_url: "/dashboard",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: "#0c0a18",
    theme_color: "#7C5CFF",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
