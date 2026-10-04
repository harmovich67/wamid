import { FlaskConical, Lock } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { PageHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CodePlayground } from "@/components/code/CodePlayground";

export const metadata = { title: "المختبر" };

export default async function PlaygroundPage() {
  const user = await requireStudent();

  // The teacher decides who can run code (Student settings → "محرر الكود").
  if (user.student?.codeEnabled === false) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="المختبر" subtitle="مكان لتجربة الكود وتشغيله." />
        <EmptyState icon={Lock} title="المحرر غير مفعّل لك حاليًا" description="معلّمك هو من يفعّل محرر الكود. اطلب منه تفعيله عندما تكون جاهزًا لتجربة الكود بنفسك." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-1.5">
            <FlaskConical className="size-4" /> المختبر
          </span>
        }
        title="جرّب أفكارك هنا"
        subtitle="اكتب Python أو JavaScript أو HTML وشغّله فورًا داخل المتصفح — بدون تثبيت أي شيء. يُحفظ كودك على هذا الجهاز تلقائيًا."
      />
      <CodePlayground storageKey="wameed-playground" minLines={14} />
    </div>
  );
}
