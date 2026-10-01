"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Activity, Bot, KeyRound, MessagesSquare, PlugZap, RotateCcw, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { StatCard } from "@/components/ui/StatCard";
import { Switch } from "@/components/ui/Switch";
import { api } from "@/lib/client";
import { AI_MODEL_PRESETS } from "@/lib/constants";
import { cn, formatNumber } from "@/lib/utils";

export function AISettingsForm({ settings, keyInfo, defaultPrompt, usage }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState(null);

  async function save(e) {
    e?.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/ai/settings", { method: "PUT", body: { ...form, ...(apiKey ? { apiKey } : {}) } });
      setApiKey("");
      toast.success("تم حفظ إعدادات المساعد");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeKey() {
    await api("/api/admin/ai/settings", { method: "PUT", body: { apiKey: "" } }).catch((err) => toast.error(err.message));
    toast.success("تم حذف المفتاح المحفوظ");
    router.refresh();
  }

  async function runTest() {
    setTesting(true);
    setTest(null);
    try {
      await save();
      const res = await api("/api/admin/ai/test", { method: "POST" });
      setTest({ ok: true, ...res });
    } catch (err) {
      setTest({ ok: false, error: err.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="المساعد الذكي — ومضة AI" subtitle="تحكّم كامل في مساعد Gemini: التشغيل، النموذج، الحدود، والتعليمات." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Activity} label="رسائل اليوم" value={formatNumber(usage.today)} />
        <StatCard icon={MessagesSquare} label="رسائل هذا الأسبوع" value={formatNumber(usage.week)} tone="sky" />
        <StatCard icon={Bot} label="محادثات" value={formatNumber(usage.conversations)} tone="mint" />
        <StatCard icon={KeyRound} label="المفتاح" value={keyInfo.saved || keyInfo.env ? "مضبوط" : "غير مضبوط"} hint={keyInfo.saved ? keyInfo.saved : keyInfo.env ? "من متغير البيئة" : "أضفه أدناه"} tone={keyInfo.saved || keyInfo.env ? "mint" : "coral"} />
      </div>

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5 rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6">
          <Switch checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} label="تشغيل المساعد" description="عند الإيقاف يختفي المساعد من واجهة جميع الطلاب" />

          <Field label="النموذج" hint="اختر من القائمة أو اكتب معرّف أي نموذج Gemini">
            <div className="mb-2 flex flex-wrap gap-2">
              {AI_MODEL_PRESETS.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setForm({ ...form, model: m.id })}
                  className={cn("rounded-xl border px-3 py-2 text-sm transition", form.model === m.id ? "border-primary bg-primary-soft text-primary" : "border-line hover:bg-surface-2")}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <Input dir="ltr" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </Field>

          <Field label="مفتاح Gemini API" hint={keyInfo.saved ? `المفتاح المحفوظ: ${keyInfo.saved}` : keyInfo.env ? "يُستخدم المفتاح من GEMINI_API_KEY. يمكنك تجاوزه هنا." : "احصل عليه من Google AI Studio"}>
            <div className="flex gap-2">
              <Input dir="ltr" type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={keyInfo.saved ? "اتركه فارغًا للإبقاء على المفتاح الحالي" : "AIza…"} />
              {keyInfo.saved && <Button type="button" variant="ghost" onClick={removeKey}>حذف</Button>}
            </div>
          </Field>

          <Field label="تعليمات المساعد (System prompt)" hint="تحدد شخصية المساعد وأسلوبه. اتركها فارغة لاستخدام التعليمات الافتراضية.">
            <Textarea rows={10} value={form.systemPrompt ?? ""} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} placeholder={defaultPrompt} />
            <button type="button" onClick={() => setForm({ ...form, systemPrompt: defaultPrompt })} className="mt-2 flex items-center gap-1 text-xs text-primary">
              <RotateCcw className="size-3" /> تحميل التعليمات الافتراضية للتعديل عليها
            </button>
          </Field>
        </div>

        <div className="space-y-5 self-start">
          <div className="space-y-4 rounded-3xl border border-line bg-surface p-5 shadow-card">
            <h3 className="font-semibold">الحدود والسلوك</h3>
            <Field label="حد الرسائل اليومي لكل طالب" hint="0 = بلا حد">
              <Input type="number" min={0} max={1000} value={form.dailyLimit} onChange={(e) => setForm({ ...form, dailyLimit: Number(e.target.value) })} />
            </Field>
            <Field label="أقصى طول للرد (tokens)">
              <Input type="number" min={128} max={8192} step={64} value={form.maxOutputTokens} onChange={(e) => setForm({ ...form, maxOutputTokens: Number(e.target.value) })} />
            </Field>
            <Field label={`الإبداعية (temperature): ${form.temperature}`}>
              <input type="range" min={0} max={1.5} step={0.1} value={form.temperature} onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })} className="w-full accent-[var(--primary)]" />
            </Field>
            <Switch checked={form.allowCodeReview} onChange={(v) => setForm({ ...form, allowCodeReview: v })} label="مراجعة الكود" description="السماح للطلاب بطلب مراجعة كودهم" />
            <Switch checked={form.allowFullSolutions} onChange={(v) => setForm({ ...form, allowFullSolutions: v })} label="السماح بالحلول الكاملة" description="يُفضّل إبقاؤه متوقفًا لتشجيع التفكير" />
          </div>

          <div className="flex gap-2">
            <Button type="submit" loading={saving} className="flex-1"><Save className="size-4" /> حفظ</Button>
            <Button type="button" variant="secondary" onClick={runTest} loading={testing}>{!testing && <PlugZap className="size-4" />} اختبار</Button>
          </div>
          {test && (
            <div className={cn("rounded-2xl p-4 text-sm", test.ok ? "bg-mint-soft" : "bg-coral-soft text-coral")}>
              {test.ok ? (
                <>
                  <div className="font-semibold text-mint">✓ يعمل — {test.model} ({formatNumber(test.ms)}ms)</div>
                  <p className="mt-1">{test.reply}</p>
                </>
              ) : (
                test.error
              )}
            </div>
          )}

          {usage.top.length > 0 && (
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
              <h3 className="mb-3 font-semibold">الأكثر استخدامًا (7 أيام)</h3>
              {usage.top.map((u) => (
                <div key={u.name} className="flex items-center justify-between py-1.5 text-sm">
                  <span>{u.name}</span>
                  <span className="text-muted">{formatNumber(u.count)} رسالة</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
