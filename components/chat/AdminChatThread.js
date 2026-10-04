"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Switch } from "@/components/ui/Switch";
import { useMounted } from "@/components/ui/useMounted";
import { api } from "@/lib/client";
import { timeAgo } from "@/lib/utils";
import { ChatThread } from "./ChatThread";
import { refreshInbox } from "./ChatInbox";

function AccessSwitch({ studentId, enabled, setEnabled }) {
  const [busy, setBusy] = useState(false);

  async function toggle(next) {
    setBusy(true);
    try {
      await api("/api/admin/chats", { method: "POST", body: { userIds: [studentId], enabled: next } });
      setEnabled(next);
      refreshInbox();
      toast.success(next ? "فُتحت المراسلة — وصل الطالب إشعار بذلك" : "أُغلقت المراسلة لهذا الطالب");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-line bg-bg px-2 py-1.5 sm:px-2.5">
      <span className="text-xs font-medium max-sm:hidden">{enabled ? "المراسلة مفتوحة" : "المراسلة مغلقة"}</span>
      <Switch checked={enabled} disabled={busy} onChange={toggle} />
    </div>
  );
}

export function AdminChatThread({ student, initial, maxBytes }) {
  const mounted = useMounted();
  return (
    <ChatThread
      key={student.id}
      studentId={student.id}
      viewerRole="ADMIN"
      initial={initial}
      maxBytes={maxBytes}
      onActivity={refreshInbox}
      peerAvatar={<Avatar name={student.name} color={student.avatarColor} avatar={student.avatar} size={30} />}
      emptyHint={initial.enabled ? "ابدأ المحادثة برسالة ترحيب أو تشجيع 👋" : "المراسلة مغلقة لهذا الطالب. افتحها من الزر أعلاه ليستطيع الرد عليك."}
      header={({ enabled, setEnabled }) => (
        <div className="flex min-w-0 items-center gap-2 border-b border-line px-3 py-3 sm:gap-3 sm:px-4">
          <Link href="/admin/chats" className="grid size-9 shrink-0 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg lg:hidden" aria-label="رجوع">
            <ArrowRight className="size-5" />
          </Link>
          <Avatar name={student.name} color={student.avatarColor} avatar={student.avatar} size={40} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{student.name}</div>
            <div className="truncate text-xs text-muted" dir="auto">
              @{student.username}
              {mounted && student.lastLoginAt && ` · آخر دخول ${timeAgo(student.lastLoginAt)}`}
            </div>
          </div>
          <Link
            href={`/admin/students/${student.id}`}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg max-[380px]:hidden"
            title="ملف الطالب"
            aria-label="ملف الطالب"
          >
            <UserRound className="size-5" />
          </Link>
          <AccessSwitch studentId={student.id} enabled={enabled} setEnabled={setEnabled} />
        </div>
      )}
    />
  );
}
