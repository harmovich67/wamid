"use client";

import { LogoMark } from "@/components/brand/Logo";
import { ChatThread } from "./ChatThread";

export function StudentChat({ initial, teacher, maxBytes }) {
  return (
    <ChatThread
      viewerRole="STUDENT"
      initial={initial}
      maxBytes={maxBytes}
      peerAvatar={<LogoMark size={30} />}
      emptyHint="اسأل معلّمك عن أي شيء: صوّر الكود أو الخطأ الذي يظهر لك، أو أرفق ملف مشروعك 📎"
      header={({ enabled }) => (
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <div className="relative">
            <LogoMark size={42} />
            <span className={`absolute -bottom-0.5 -end-0.5 size-3.5 rounded-full border-2 border-surface ${enabled ? "bg-mint" : "bg-line"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{teacher.name}</div>
            <div className="truncate text-xs text-muted">{enabled ? teacher.title ?? "معلّمك · يرد عليك في أقرب وقت" : "المراسلة مغلقة حاليًا"}</div>
          </div>
        </div>
      )}
    />
  );
}
