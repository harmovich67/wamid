"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, Paperclip, Plus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { CodeField } from "@/components/editor/CodeField";
import { FileButton } from "@/components/ui/FileButton";
import { Tabs } from "@/components/ui/Tabs";
import { api } from "@/lib/client";
import { formatBytes } from "@/lib/utils";

export function SubmissionForm({ taskId, initial, status }) {
  const router = useRouter();
  const [tab, setTab] = useState("text");
  const [form, setForm] = useState(initial ?? { content: "", code: "", links: [], files: [] });
  const [link, setLink] = useState("");
  const [codeLang, setCodeLang] = useState("python");
  const [loading, setLoading] = useState(false);

  function addLink() {
    const v = link.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) return toast.error("الرابط يجب أن يبدأ بـ https://");
    setForm((f) => ({ ...f, links: [...f.links, v] }));
    setLink("");
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api(`/api/tasks/${taskId}/submit`, { method: "POST", body: form });
      toast.success("تم التسليم! سيراجعه معلّمك قريبًا 🚀");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[2rem] border border-line bg-surface p-6 shadow-card">
      <div>
        <h2 className="font-semibold">{status ? "تعديل التسليم" : "سلّم حلّك"}</h2>
        <p className="text-sm text-muted">
          {status === "NEEDS_REVISION" ? "راجع ملاحظات المعلّم ثم أعد التسليم." : "اكتب شرحك، الصق الكود، أضف روابط أو ملفات."}
        </p>
      </div>

      <Tabs
        layoutId="submission-tabs"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "text", label: "الشرح" },
          { value: "code", label: "الكود" },
          { value: "links", label: "روابط وملفات", count: form.links.length + form.files.length || null },
        ]}
      />

      {tab === "text" && (
        <RichTextEditor
          minHeight={200}
          placeholder="اشرح فكرتك وخطواتك…"
          value={form.content}
          onChange={(content) => setForm((f) => ({ ...f, content }))}
        />
      )}
      {tab === "code" && (
        <CodeField
          showTitle={false}
          minLines={12}
          code={form.code}
          language={codeLang}
          placeholder="# اكتب أو الصق الكود هنا"
          onChange={(p) => {
            if (p.language) setCodeLang(p.language);
            if (p.code !== undefined) setForm((f) => ({ ...f, code: p.code }));
          }}
        />
      )}
      {tab === "links" && (
        <div className="space-y-4">
          <Field label="روابط (GitHub، Replit، موقعك…)">
            <div className="flex gap-2">
              <Input dir="ltr" placeholder="https://github.com/…" value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())} />
              <Button type="button" variant="secondary" onClick={addLink}>
                <Plus className="size-4" />
              </Button>
            </div>
          </Field>
          {form.links.map((l, i) => (
            <div key={l + i} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
              <Link2 className="size-4 text-primary" />
              <span className="min-w-0 flex-1 truncate" dir="ltr">{l}</span>
              <button type="button" onClick={() => setForm((f) => ({ ...f, links: f.links.filter((_, j) => j !== i) }))} className="text-muted hover:text-coral" aria-label="حذف">
                <X className="size-4" />
              </button>
            </div>
          ))}
          <div>
            <FileButton multiple label="إرفاق ملفات" onUploaded={(file) => setForm((f) => ({ ...f, files: [...f.files, { url: file.url, name: file.name, size: file.size }] }))} />
            <p className="mt-1 text-xs text-muted">صور، PDF، ملفات كود أو ZIP — حتى 10MB للملف.</p>
          </div>
          {form.files.map((f, i) => (
            <div key={f.url} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
              <Paperclip className="size-4 text-primary" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="text-xs text-muted">{formatBytes(f.size)}</span>
              <button type="button" onClick={() => setForm((s) => ({ ...s, files: s.files.filter((_, j) => j !== i) }))} className="text-muted hover:text-coral" aria-label="حذف">
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={loading}>
          {!loading && <Send className="size-4 -scale-x-100" />}
          {status ? "إعادة التسليم" : "تسليم"}
        </Button>
      </div>
    </form>
  );
}
