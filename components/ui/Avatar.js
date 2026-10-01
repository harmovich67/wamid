import { cn, initials } from "@/lib/utils";

export function Avatar({ name, color = "#7C5CFF", avatar, size = 36, className }) {
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: avatar ? size * 0.55 : size * 0.38,
        background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 55%, #1a1233))`,
      }}
      aria-hidden="true"
    >
      {avatar || initials(name)}
    </span>
  );
}
