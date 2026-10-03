"use client";

import { useState } from "react";
import { cn, formatNumber } from "@/lib/utils";

const dayFmt = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "short", day: "numeric", month: "short" });
const tickFmt = new Intl.DateTimeFormat("ar-u-nu-latn", { day: "numeric", month: "numeric" });

/**
 * Single-series column chart (lessons completed per day). One hue, no legend (the card title
 * names the series), hairline baseline, peak labeled directly, per-bar hover tooltip,
 * and a visually-hidden table so the numbers are available without the chart.
 */
export function ActivityChart({ data, height = 180 }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);
  const nice = Math.max(4, Math.ceil(max / 4) * 4);

  return (
    <div className="relative touch-pan-y">
      <div className="relative flex items-end gap-0.5 touch-pan-y" style={{ height }} role="img" aria-label="عدد الدروس المكتملة يوميًا خلال آخر 14 يومًا">
        {[0.5, 1].map((f) => (
          <div key={f} className="pointer-events-none absolute inset-x-0 border-t border-line" style={{ bottom: `${f * 100}%` }}>
            <span className="absolute -top-2.5 end-full me-2 text-[10px] text-muted">{formatNumber(Math.round(nice * f))}</span>
          </div>
        ))}
        {data.map((d, i) => {
          const h = (d.value / nice) * 100;
          const active = hover === i;
          return (
            <div
              key={d.date}
              className="relative flex h-full flex-1 cursor-default items-end justify-center touch-pan-y"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {i === peak && d.value > 0 && hover === null && (
                <span className="absolute text-[11px] font-semibold text-fg" style={{ bottom: `calc(${h}% + 4px)` }}>
                  {formatNumber(d.value)}
                </span>
              )}
              <div
                className={cn("w-full max-w-6 rounded-t-[4px] transition-opacity", hover !== null && !active && "opacity-40")}
                style={{ height: d.value ? `max(${h}%, 3px)` : "2px", background: d.value ? "var(--primary)" : "var(--line)" }}
              />
              {active && (
                <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop" style={{ bottom: `${h}%` }}>
                  <div className="text-muted">{dayFmt.format(new Date(d.date))}</div>
                  <div className="mt-0.5 font-semibold text-fg">
                    {formatNumber(d.value)} درس مكتمل
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex border-t border-line pt-2 text-[10px] text-muted">
        {data.map((d, i) => (
          <span key={d.date} className="flex-1 text-center">
            {i % 3 === 0 || i === data.length - 1 ? tickFmt.format(new Date(d.date)) : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>الدروس المكتملة يوميًا</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <th scope="row">{d.date}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
