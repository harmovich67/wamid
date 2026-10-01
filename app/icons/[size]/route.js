import { ImageResponse } from "next/og";
import { markSvg } from "@/lib/brand";

// PNG app icons for the web manifest: /icons/192 and /icons/512 (maskable-safe padding).
const SIZES = new Set([192, 512]);

export async function GET(_req, { params }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const inner = Math.round(size * 0.8);
  const src = `data:image/svg+xml;base64,${Buffer.from(markSvg({ size: inner, radius: 0 })).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#9377FF,#4F32E6)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={inner} height={inner} alt="" />
      </div>
    ),
    { width: size, height: size }
  );
}
