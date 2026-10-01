"use client";

import { Check } from "lucide-react";
import { AVATARS, PALETTE } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Lets a student pick a background color and, optionally, a boy/girl avatar
// character. onChange receives the full { avatarColor, avatar } pair each time.
export function AvatarPicker({ color = "#7C5CFF", avatar, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-xs font-medium text-muted">اللون</div>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => onChange({ avatarColor: c, avatar })}
              className={cn("grid size-9 place-items-center rounded-full text-white transition", color === c && "ring-4 ring-primary/25")}
              style={{ background: c }}
              aria-label={c}
            >
              {color === c && !avatar && <Check className="size-4" />}
            </button>
          ))}
        </div>
      </div>

      {[
        ["أولاد", AVATARS.boy],
        ["بنات", AVATARS.girl],
      ].map(([label, list]) => (
        <div key={label}>
          <div className="mb-2 text-xs font-medium text-muted">{label}</div>
          <div className="flex flex-wrap gap-2">
            {list.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => onChange({ avatarColor: color, avatar: emoji })}
                className={cn("grid size-11 place-items-center rounded-full text-xl transition", avatar === emoji ? "ring-4 ring-primary/25" : "opacity-90 hover:scale-105 hover:opacity-100")}
                style={{ background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 55%, #1a1233))` }}
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}

      {avatar && (
        <button type="button" onClick={() => onChange({ avatarColor: color, avatar: null })} className="text-xs text-muted underline hover:text-fg">
          إزالة الأفاتار (استخدام الحروف الأولى من الاسم)
        </button>
      )}
    </div>
  );
}
