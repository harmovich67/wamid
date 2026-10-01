// Single source of truth for the Wameed mark: a spark of light between code brackets,
// with a small second spark for growth. Used by the <Logo/> component, favicon and app icons.

export const BRAND = {
  name: "وَمِيض",
  nameEn: "Wameed",
  tagline: "شرارة المعرفة التي تصنع المبرمجين",
  primary: "#7C5CFF",
  deep: "#4F32E6",
  amber: "#FFB547",
};

export const SPARK_PATH =
  "M32 13.5C33.3 26 35.2 30.4 42.5 32C35.2 33.6 33.3 38 32 50.5C30.7 38 28.8 33.6 21.5 32C28.8 30.4 30.7 26 32 13.5Z";
export const SMALL_SPARK_PATH =
  "M50.5 8.5C51 11.8 51.8 12.6 55 13.1C51.8 13.6 51 14.4 50.5 17.7C50 14.4 49.2 13.6 46 13.1C49.2 12.6 50 11.8 50.5 8.5Z";
export const LEFT_BRACKET = "M18.5 23L10.5 32L18.5 41";
export const RIGHT_BRACKET = "M45.5 23L53.5 32L45.5 41";

export function markSvg({ size = 64, radius = 18 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
<defs>
<clipPath id="wclip"><rect width="64" height="64" rx="${radius}"/></clipPath>
<linearGradient id="wbg" x1="6" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop stop-color="#9377FF"/><stop offset="1" stop-color="#4F32E6"/></linearGradient>
<linearGradient id="wsp" x1="32" y1="13" x2="32" y2="51" gradientUnits="userSpaceOnUse"><stop stop-color="#FFE3A3"/><stop offset=".5" stop-color="#FFB547"/><stop offset="1" stop-color="#FF8A3D"/></linearGradient>
</defs>
<rect width="64" height="64" rx="${radius}" fill="url(#wbg)"/>
<path clip-path="url(#wclip)" d="M0 0H64V26C44 20 20 20 0 30Z" fill="#fff" fill-opacity=".08"/>
<path d="${LEFT_BRACKET}" stroke="#fff" stroke-opacity=".92" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${RIGHT_BRACKET}" stroke="#fff" stroke-opacity=".92" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${SPARK_PATH}" fill="url(#wsp)"/>
<path d="${SMALL_SPARK_PATH}" fill="#fff"/>
</svg>`;
}
