"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bot, BotOff, Search, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { api } from "@/lib/client";
import { cn, formatNumber } from "@/lib/utils";

/** Per-student control over who can see and use the AI assistant. */
export function AIAccessPanel({ students, globalEnabled }) {
  const router = useRouter();
  const [list, setList] = useState(students);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(null);
  const enabledCount = list.filter((s) => s.aiEnabled).length;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? list.filter((s) => s.name.toLowerCase().includes(t) || s.username.includes(t)) : list;
  }, [list, q]);

  async function update(body, apply) {
    setBusy(body.all ? "all" : body.userIds[0]);
    try {
      await api("/api/admin/ai/access", { method: "POST", body });
      setList(apply);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  const toggle = (s, enabled) => update({ userIds: [s.userId], enabled }, (l) => l.map((x) => (x.userId === s.userId ? { ...x, aiEnabled: enabled } : x)));
  const setAll = (enabled) =>
    update({ all: true, enabled }, (l) => l.map((x) => ({ ...x, aiEnabled: enabled }))).then(() =>
      toast.success(enabled ? "تم تفعيل المساعد لكل الطلاب" : "تم إيقاف المساعد لكل الطلاب")
    );

  return (
    <section className="rounded-3xl border border-line bg-surface shadow-card">
      <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold">من يستطيع استخدام المساعد؟</h3>
            <p className="text-sm text-muted">
              {globalEnabled ? (
                <>
                  مفعّل لـ <b className="text-fg">{formatNumber(enabledCount)}</b> من {formatNumber(list.length)} طالب. الطالب الموقوف لا يرى المساعد إطلاقًا.
                </>
              ) : (
                <span className="text-coral">المساعد متوقف للجميع من الإعداد العام أعلاه — هذه الاختيارات ستُطبّق عند تشغيله.</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="soft" size="sm" loading={busy === "all"} onClick={() => setAll(true)}>
            <Bot className="size-4" /> تفعيل للجميع
          </Button>
          <Button variant="secondary" size="sm" disabled={busy === "all"} onClick={() => setAll(false)}>
            <BotOff className="size-4" /> إيقاف للجميع
          </Button>
        </div>
      </div>
      <div className="p-5">
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input className="ps-10" placeholder="ابحث عن طالب" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <div
              key={s.userId}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 transition",
                s.aiEnabled ? "border-primary/30 bg-primary-soft/40" : "border-line"
              )}
            >
              <Avatar name={s.name} color={s.avatarColor} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{s.name}</div>
                <div className="text-xs text-muted">{s.aiEnabled ? `${formatNumber(s.messages)} رسالة هذا الأسبوع` : "المساعد مخفي"}</div>
              </div>
              <Switch checked={s.aiEnabled} disabled={busy === s.userId} onChange={(v) => toggle(s, v)} />
            </div>
          ))}
          {filtered.length === 0 && <p className="col-span-full py-6 text-center text-sm text-muted">لا يوجد طلاب.</p>}
        </div>
      </div>
    </section>
  );
}
