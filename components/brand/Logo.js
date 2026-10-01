import { LEFT_BRACKET, RIGHT_BRACKET, SMALL_SPARK_PATH, SPARK_PATH } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 36, className, animated = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="wm-bg" x1="6" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9377FF" />
          <stop offset="1" stopColor="#4F32E6" />
        </linearGradient>
        <linearGradient id="wm-spark" x1="32" y1="13" x2="32" y2="51" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE3A3" />
          <stop offset=".5" stopColor="#FFB547" />
          <stop offset="1" stopColor="#FF8A3D" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#wm-bg)" />
      <path d="M0 18C0 8 8 0 18 0H46C56 0 64 8 64 18V26C44 20 20 20 0 30Z" fill="#fff" fillOpacity=".08" />
      <path d={LEFT_BRACKET} stroke="#fff" strokeOpacity=".92" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={RIGHT_BRACKET} stroke="#fff" strokeOpacity=".92" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={SPARK_PATH}
        fill="url(#wm-spark)"
        className={animated ? "origin-center animate-twinkle [transform-box:fill-box]" : undefined}
      />
      <path d={SMALL_SPARK_PATH} fill="#fff" />
    </svg>
  );
}

export function Logo({ size = 36, className, withText = true, subtitle = true }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {withText && (
        <span className="flex flex-col leading-none">
          <span className="text-xl font-bold tracking-tight">وَمِيض</span>
          {subtitle && (
            <span className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-muted">
              Wameed
            </span>
          )}
        </span>
      )}
    </span>
  );
}
