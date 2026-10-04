import Link from "next/link";
import { BookOpenCheck, CircleHelp, ClipboardCheck, Download, GraduationCap, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/lib/analytics";
import { listGroups } from "@/lib/groups";
import { PageHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { ActivityChart } from "@/components/admin/ActivityChart";
import { CourseFunnel, InactiveList, StudentsTable } from "@/components/admin/AnalyticsWidgets";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, formatNumber } from "@/lib/utils";

export const metadata = { title: "التحليلات" };

const PERIODS = [7, 30, 90];

function Panel({ title, subtitle, children, className }) {
  return (
    <section className={cn("min-w-0 rounded-3xl border border-line bg-surface shadow-card", className)}>
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Chip({ href, active, children }) {
  return (
    <Link
      href={href}
      className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition", active ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-fg")}
    >
      {children}
    </Link>
  );
}

export default async function AnalyticsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const days = PERIODS.includes(Number(sp.days)) ? Number(sp.days) : 30;
  const groupId = sp.group || null;
  const [data, groups] = await Promise.all([getAnalytics({ days, groupId }), listGroups()]);
  const { kpis } = data;
  const qs = (patch) => {
    const p = new URLSearchParams({ days: String(days), ...(groupId ? { group: groupId } : {}), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `?${p}`;
  };
  const group = groups.find((g) => g.id === groupId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="التحليلات"
        subtitle={group ? `فصل ${group.name}` : "أين يتقدّم طلابك، وأين يتوقفون، وأي الأسئلة أصعب عليهم."}
        action={
          <a href={`/api/admin/analytics/export${qs({})}`} className={buttonClass({ variant: "secondary", size: "sm" })} download>
            <Download className="size-4" /> تصدير Excel
          </a>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5">
          {PERIODS.map((d) => (
            <Chip key={d} href={qs({ days: String(d) })} active={d === days}>
              آخر {formatNumber(d)} يومًا
            </Chip>
          ))}
        </div>
        {groups.length > 0 && (
          <div className="scrollbar-thin flex gap-1.5 overflow-x-auto pb-1">
            <Chip href={qs({ group: "" })} active={!groupId}>
              كل الطلاب
            </Chip>
            {groups.map((g) => (
              <Chip key={g.id} href={qs({ group: g.id })} active={g.id === groupId}>
                <span className="size-2 rounded-full" style={{ background: g.color }} /> {g.name}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {!kpis ? (
        <EmptyState icon={Users} title="لا يوجد طلاب هنا" description="أضف طلابًا (أو اختر فصلًا آخر) لتظهر التحليلات." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Users} label="طلاب نشطون" value={`${formatNumber(kpis.active)}/${formatNumber(kpis.students)}`} hint={`خلال آخر ${formatNumber(days)} يومًا`} />
            <StatCard icon={BookOpenCheck} label="دروس مكتملة" value={formatNumber(kpis.lessons)} tone="mint" hint={kpis.students ? `${(kpis.lessons / kpis.students).toFixed(1)} لكل طالب` : null} />
            <StatCard icon={ClipboardCheck} label="تسليمات" value={formatNumber(kpis.submissions)} tone="sky" hint={`${formatNumber(kpis.approved)} مقبولة${kpis.avgGrade != null ? ` · متوسط ${formatNumber(kpis.avgGrade)}` : ""}`} />
            <StatCard icon={CircleHelp} label="نتيجة الاختبارات" value={kpis.quizPercent != null ? `${formatNumber(kpis.quizPercent)}%` : "—"} tone="amber" hint="متوسط كل الطلاب" />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title="نشاط التعلّم" subtitle={`الدروس المكتملة يوميًا — آخر ${formatNumber(data.series.length)} يومًا`} className="xl:col-span-2">
              <div className="ps-6">
                <ActivityChart data={data.series} label={`عدد الدروس المكتملة يوميًا خلال آخر ${data.series.length} يومًا`} />
              </div>
            </Panel>
            <Panel title="غابوا أسبوعًا أو أكثر" subtitle={`${formatNumber(data.inactive.length)} طالب — تواصل معهم أو مع أهلهم`}>
              <InactiveList rows={data.inactive} />
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="أين يتوقف الطلاب؟" subtitle="دروس فتحها طلاب كثيرون ولم يكملوها">
              {data.stuck.length === 0 ? (
                <p className="text-sm text-muted">لا توجد دروس متعثرة حاليًا 👌 (تُحسب من الآن فصاعدًا عند فتح الطلاب للدروس).</p>
              ) : (
                <ul className="space-y-3">
                  {data.stuck.map((l) => (
                    <li key={l.id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">{l.title}</span>
                        <span className="shrink-0 text-xs font-semibold text-coral">{formatNumber(l.stuck)} متوقف</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-coral-soft">
                          <div className="h-full rounded-full bg-mint" style={{ width: `${l.rate ?? 0}%` }} />
                        </div>
                        <span className="w-28 shrink-0 text-end text-[11px] text-muted">
                          {formatNumber(l.done)}/{formatNumber(l.opened)} أكملوا · {l.course}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="أصعب الأسئلة" subtitle="نسبة من أجاب صحيحًا من أول محاولة">
              {data.hardQuestions.length > 0 ? (
                <ul className="space-y-4">
                  {data.hardQuestions.map((q) => (
                    <li key={q.id} className="text-sm">
                      <div className="flex items-start gap-3">
                        <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold", q.percent < 40 ? "bg-coral-soft text-coral" : q.percent < 70 ? "bg-amber-soft text-amber" : "bg-mint-soft text-mint")}>
                          {formatNumber(q.percent)}%
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium leading-6" dir="auto">
                            {q.question}
                          </div>
                          <div className="mt-0.5 text-xs text-muted">
                            <Link href={`/admin/lessons/${q.lesson.id}`} className="hover:text-primary">
                              {q.lesson.title}
                            </Link>{" "}
                            · {formatNumber(q.answers)} إجابة
                          </div>
                          {q.commonWrong?.text && (
                            <div className="mt-1.5 rounded-xl bg-coral-soft/60 px-3 py-1.5 text-xs" dir="auto">
                              الخطأ الأشهر: «{q.commonWrong.text}» ({formatNumber(q.commonWrong.count)}) · الصحيح: «{q.correct}»
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : data.hardLessons.length > 0 ? (
                <>
                  <p className="mb-3 text-xs text-muted">تفاصيل كل سؤال تظهر بعد أن يجيب 3 طلاب على الأقل. حتى ذلك الحين: أضعف الاختبارات حسب الدرس.</p>
                  <ul className="space-y-2">
                    {data.hardLessons.map((l) => (
                      <li key={l.id} className="flex items-center gap-3 text-sm">
                        <GraduationCap className="size-4 shrink-0 text-amber" />
                        <Link href={`/admin/lessons/${l.id}`} className="min-w-0 flex-1 truncate hover:text-primary">
                          {l.title}
                        </Link>
                        <span className="shrink-0 text-xs font-semibold">{formatNumber(l.percent)}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-muted">لا توجد إجابات كافية بعد.</p>
              )}
            </Panel>
          </div>

          <Panel title="مسار كل دورة" subtitle="كم طالبًا وصل لكل درس — الهبوط المفاجئ يدلّ على درس يحتاج شرحًا إضافيًا">
            <CourseFunnel funnels={data.funnels} />
          </Panel>

          <Panel title="كل الطلاب" subtitle="اضغط عنوان العمود للترتيب">
            <StudentsTable rows={data.rows} />
          </Panel>
        </>
      )}
    </div>
  );
}
