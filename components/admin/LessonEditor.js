"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowDown, ArrowRight, ArrowUp, CircleHelp, CodeXml, Eye, FileText, Image as ImageIcon,
  Paperclip, Pencil, Plus, Save, Trash2, Video, X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FileButton } from "@/components/ui/FileButton";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { BlockRenderer } from "@/components/lesson/BlockRenderer";
import { AIButton, AudienceSelect } from "./AIKit";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { CodeField } from "@/components/editor/CodeField";
import { AILessonModal } from "./AILessonModal";
import { api, uid } from "@/lib/client";
import { BLOCK_TYPES, CODE_LANGUAGES } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";

const BLOCK_ICONS = { text: FileText, video: Video, image: ImageIcon, code: CodeXml, attachment: Paperclip, callout: AlertTriangle };

const NEW_BLOCK = {
  text: () => ({ markdown: "" }),
  video: () => ({ url: "", caption: "" }),
  image: () => ({ url: "", caption: "" }),
  code: () => ({ language: "python", title: "", code: "" }),
  attachment: () => ({ url: "", name: "" }),
  callout: () => ({ variant: "tip", markdown: "" }),
};

function BlockFields({ block, update, aiContext }) {
  switch (block.type) {
    case "text":
      return (
        <RichTextEditor
          ai
          aiContext={aiContext}
          minHeight={200}
          value={block.markdown}
          onChange={(markdown) => update({ markdown })}
          placeholder={"## عنوان\nاكتب الشرح هنا… كل سطر يأخذ اتجاهه تلقائيًا، والكود الملصق يتحول لكتلة كود."}
        />
      );
    case "callout":
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            {[
              ["tip", "نصيحة"],
              ["info", "معلومة"],
              ["warning", "تنبيه"],
            ].map(([v, l]) => (
              <button type="button" key={v} onClick={() => update({ variant: v })} className={cn("rounded-lg border px-3 py-1.5 text-xs", block.variant === v ? "border-primary bg-primary-soft text-primary" : "border-line text-muted")}>
                {l}
              </button>
            ))}
          </div>
          <RichTextEditor ai aiContext={aiContext} minHeight={80} value={block.markdown} onChange={(markdown) => update({ markdown })} />
        </div>
      );
    case "code":
      return (
        <CodeField
          ai
          aiContext={aiContext}
          code={block.code}
          language={block.language}
          title={block.title}
          onChange={update}
          placeholder={'print("Hello, Wameed!")'}
        />
      );
    case "video":
    case "image":
      return (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input dir="ltr" value={block.url} onChange={(e) => update({ url: e.target.value })} placeholder={block.type === "video" ? "https://youtube.com/watch?v=… أو ارفع ملف" : "https://… أو ارفع صورة"} />
            <FileButton accept={block.type === "video" ? "video/*" : "image/*"} label="رفع" onUploaded={(f) => update({ url: f.url })} />
          </div>
          <Input value={block.caption ?? ""} onChange={(e) => update({ caption: e.target.value })} placeholder="وصف (اختياري)" />
        </div>
      );
    case "attachment":
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {block.url ? (
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
              <Paperclip className="size-4 text-primary" />
              <Input className="h-8 flex-1" value={block.name} onChange={(e) => update({ name: e.target.value })} />
              {block.size ? <span className="text-xs text-muted">{formatBytes(block.size)}</span> : null}
            </div>
          ) : (
            <span className="flex-1 text-sm text-muted">لم يُرفع ملف بعد</span>
          )}
          <FileButton label={block.url ? "استبدال" : "رفع ملف"} onUploaded={(f) => update({ url: f.url, name: f.name, size: f.size })} />
        </div>
      );
    default:
      return null;
  }
}

function blocksToText(blocks) {
  return blocks.map((b) => [b.title, b.markdown, b.code].filter(Boolean).join("\n")).join("\n\n");
}

function QuizGenerator({ title, blocks, onAdd }) {
  const [count, setCount] = useState(4);
  const [audience, setAudience] = useState("teens");
  const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true);
    try {
      const res = await api("/api/admin/ai/generate/quiz", { method: "POST", body: { title: title || "درس", content: blocksToText(blocks), count, audience } });
      onAdd(res.questions);
      toast.success(`تمت إضافة ${res.questions.length} أسئلة — راجعها ثم احفظ`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary-soft/40 p-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <div className="font-semibold">توليد أسئلة من محتوى الدرس</div>
        <p className="text-xs text-muted">يقرأ الذكاء الاصطناعي الشرح والكود ويكتب أسئلة تقيس الفهم.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:w-64">
        <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="h-9 rounded-xl border border-line bg-surface px-2 text-sm">
          {[2, 3, 4, 5, 6, 8].map((n) => (
            <option key={n} value={n}>{n} أسئلة</option>
          ))}
        </select>
        <div className="[&_select]:h-9"><AudienceSelect value={audience} onChange={setAudience} /></div>
      </div>
      <AIButton size="sm" loading={loading} onClick={run} disabled={!blocks.length}>{loading ? "يكتب الأسئلة…" : "توليد"}</AIButton>
    </div>
  );
}

function QuizEditor({ quiz, setQuiz, title, blocks }) {
  const updateQ = (i, patch) => setQuiz(quiz.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  return (
    <div className="space-y-4">
      <QuizGenerator title={title} blocks={blocks} onAdd={(qs) => setQuiz([...quiz, ...qs.map((q) => ({ ...q, explanation: q.explanation ?? "" }))])} />
      {quiz.length === 0 && <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">لا أسئلة بعد. الاختبار اختياري لكنه يثبّت الفهم ويمنح نقاطًا إضافية للعلامة الكاملة.</p>}
      {quiz.map((q, i) => (
        <div key={i} className="space-y-3 rounded-2xl border border-line bg-surface p-3.5 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sky-soft text-xs font-bold text-sky">{i + 1}</span>
            <Input value={q.question} onChange={(e) => updateQ(i, { question: e.target.value })} placeholder="نص السؤال" />
            <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={() => setQuiz(quiz.filter((_, j) => j !== i))} aria-label="حذف السؤال"><Trash2 className="size-4 text-coral" /></Button>
          </div>
          <div className="space-y-2 ps-2 sm:ps-9">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input type="radio" name={`correct-${i}`} checked={q.correctIndex === oi} onChange={() => updateQ(i, { correctIndex: oi })} className="size-4 shrink-0 accent-[var(--mint)]" title="الإجابة الصحيحة" />
                <Input className={cn("h-9 flex-1 min-w-0", q.correctIndex === oi && "border-mint")} value={opt} onChange={(e) => updateQ(i, { options: q.options.map((o, k) => (k === oi ? e.target.value : o)) })} placeholder={`الخيار ${oi + 1}`} />
                <button
                  type="button"
                  disabled={q.options.length <= 2}
                  onClick={() => updateQ(i, { options: q.options.filter((_, k) => k !== oi), correctIndex: q.correctIndex >= oi && q.correctIndex > 0 ? q.correctIndex - 1 : q.correctIndex })}
                  className="shrink-0 text-muted hover:text-coral disabled:opacity-30 p-1"
                  aria-label="حذف الخيار"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {q.options.length < 6 && (
              <button type="button" onClick={() => updateQ(i, { options: [...q.options, ""] })} className="text-sm text-primary">+ خيار</button>
            )}
            <Input className="h-9" value={q.explanation} onChange={(e) => updateQ(i, { explanation: e.target.value })} placeholder="شرح الإجابة (يظهر بعد الحل)" />
          </div>
        </div>
      ))}
      <Button variant="soft" onClick={() => setQuiz([...quiz, { question: "", options: ["", ""], correctIndex: 0, explanation: "" }])}>
        <Plus className="size-4" /> سؤال جديد
      </Button>
    </div>
  );
}

export function LessonEditor({ lesson, course, modules }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...lesson, blocks: lesson.blocks.map((b) => ({ ...b, id: b.id || uid() })) });
  const [tab, setTab] = useState("content");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [notifyStudents, setNotifyStudents] = useState(false);

  const patch = (p) => {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  };
  const setBlocks = (fn) => patch({ blocks: fn(form.blocks) });

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const { id, ...body } = form;
      body.quiz = form.quiz.filter((q) => q.question.trim());
      body.notifyStudents = notifyStudents;
      await api(`/api/admin/lessons/${lesson.id}`, { method: "PATCH", body });
      setDirty(false);
      setNotifyStudents(false);
      toast.success("تم حفظ الدرس");
      router.refresh();
    } catch (err) {
      toast.error(err.field ? `${err.message} (${err.field})` : err.message);
    } finally {
      setSaving(false);
    }
  }, [form, lesson.id, notifyStudents, router]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    const onUnload = (e) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [save, dirty]);

  function applyAI(res, { replace, useTitle }) {
    setForm((f) => ({
      ...f,
      title: useTitle ? res.title : f.title,
      summary: f.summary && !replace ? f.summary : res.summary,
      durationMin: res.durationMin,
      blocks: replace ? res.blocks : [...f.blocks, ...res.blocks],
      quiz: replace ? res.quiz : [...f.quiz, ...res.quiz],
    }));
    setDirty(true);
    setTab("preview");
  }

  function moveBlock(i, dir) {
    setBlocks((blocks) => {
      const next = [...blocks];
      const j = i + dir;
      if (j < 0 || j >= next.length) return next;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/courses/${course.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <ArrowRight className="size-4" /> {course.title}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <span className="text-xs text-amber">تغييرات غير محفوظة</span>}
          <AIButton size="sm" onClick={() => setAiOpen(true)}>إنشاء بالذكاء الاصطناعي</AIButton>
          <Switch
            checked={form.isPublished}
            onChange={(v) => patch({ isPublished: v })}
            label={form.isPublished ? "منشور" : "مسودة"}
            className="h-9 gap-3 rounded-xl border border-line bg-surface px-3"
          />
          <Button size="sm" onClick={save} loading={saving}>
            <Save className="size-4" /> حفظ
          </Button>
        </div>
      </div>

      {dirty && form.isPublished && (
        <label className="-mt-2 flex w-fit cursor-pointer items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={notifyStudents} onChange={(e) => setNotifyStudents(e.target.checked)} className="size-3.5 accent-primary" />
          أبلغ الطلاب اللي عندهم صلاحية على الدرس بالتحديث
        </label>
      )}

      <input
        value={form.title}
        onChange={(e) => patch({ title: e.target.value })}
        className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-muted sm:text-3xl"
        placeholder="عنوان الدرس"
      />

      <Tabs
        layoutId="lesson-editor-tabs"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "content", label: "المحتوى", icon: Pencil, count: form.blocks.length || null },
          { value: "quiz", label: "الاختبار", icon: CircleHelp, count: form.quiz.length || null },
          { value: "preview", label: "معاينة", icon: Eye },
          { value: "settings", label: "الإعدادات", icon: FileText },
        ]}
      />

      {tab === "content" && (
        <div className="space-y-4">
          {form.blocks.length === 0 && (
            <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-[linear-gradient(135deg,var(--primary-soft),transparent_70%)] p-6 text-center sm:p-8">
              <div className="text-lg font-bold">درس فارغ؟ دع الذكاء الاصطناعي يكتب المسودة الأولى ✨</div>
              <p className="mx-auto mt-1 max-w-lg text-sm text-muted">اكتب الموضوع فقط، وستحصل على شرح مبسّط وأمثلة كود ونصائح واختبار — تعدّلها كما تريد قبل النشر.</p>
              <AIButton className="mt-5" onClick={() => setAiOpen(true)}>ابدأ بالذكاء الاصطناعي</AIButton>
            </div>
          )}
          {form.blocks.map((block, i) => {
            const BIcon = BLOCK_ICONS[block.type];
            return (
              <div
                key={block.id}
                className="relative rounded-3xl border border-line bg-surface p-4 shadow-card"
                style={{ zIndex: form.blocks.length - i }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                    <BIcon className="size-3.5" /> {BLOCK_TYPES[block.type]}
                  </span>
                  <div className="ms-auto flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => moveBlock(i, -1)} disabled={i === 0} aria-label="أعلى"><ArrowUp className="size-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => moveBlock(i, 1)} disabled={i === form.blocks.length - 1} aria-label="أسفل"><ArrowDown className="size-4" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setBlocks((b) => b.filter((x) => x.id !== block.id))} aria-label="حذف"><Trash2 className="size-4 text-coral" /></Button>
                  </div>
                </div>
                <BlockFields block={block} aiContext={form.title} update={(p) => setBlocks((b) => b.map((x) => (x.id === block.id ? { ...x, ...p } : x)))} />
              </div>
            );
          })}
          <div className="rounded-3xl border border-dashed border-line p-4">
            <div className="mb-3 text-sm text-muted">أضف كتلة محتوى:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(BLOCK_TYPES).map(([type, label]) => {
                const BIcon = BLOCK_ICONS[type];
                return (
                  <Button key={type} variant="secondary" size="sm" onClick={() => setBlocks((b) => [...b, { id: uid(), type, ...NEW_BLOCK[type]() }])}>
                    <BIcon className="size-4" /> {label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "quiz" && <QuizEditor quiz={form.quiz} setQuiz={(quiz) => patch({ quiz })} title={form.title} blocks={form.blocks} />}

      {tab === "preview" && (
        <div className="rounded-[2rem] border border-line bg-surface p-5 shadow-card sm:p-8">
          <h1 className="mb-2 text-2xl font-bold">{form.title}</h1>
          {form.summary && <p className="mb-6 text-muted">{form.summary}</p>}
          {form.blocks.length ? <BlockRenderer blocks={form.blocks.filter((b) => b.type === "text" || b.type === "callout" || b.type === "code" || b.url)} /> : <p className="text-muted">لا محتوى بعد.</p>}
        </div>
      )}

      {tab === "settings" && (
        <div className="grid max-w-2xl gap-4 rounded-3xl border border-line bg-surface p-5 sm:grid-cols-2">
          <Field label="ملخص الدرس" className="sm:col-span-2" hint="يظهر أعلى الدرس ويُرسل كسياق للمساعد الذكي">
            <Textarea rows={2} value={form.summary} onChange={(e) => patch({ summary: e.target.value })} />
          </Field>
          <Field label="نقاط الخبرة عند الإكمال">
            <Input type="number" min={0} max={1000} value={form.xpReward} onChange={(e) => patch({ xpReward: Number(e.target.value) })} />
          </Field>
          <Field label="المدة المتوقعة (دقيقة)">
            <Input type="number" min={1} max={600} value={form.durationMin} onChange={(e) => patch({ durationMin: Number(e.target.value) })} />
          </Field>
          <Field label="الوحدة" className="sm:col-span-2">
            <Select value={form.moduleId} onChange={(e) => patch({ moduleId: e.target.value })}>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </Select>
          </Field>
        </div>
      )}

      {aiOpen && (
        <AILessonModal
          open
          onClose={() => setAiOpen(false)}
          lesson={{ id: lesson.id, title: form.title, summary: form.summary }}
          hasContent={form.blocks.length > 0}
          onApply={applyAI}
        />
      )}
    </div>
  );
}
