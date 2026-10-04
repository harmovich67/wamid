import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BookOpenCheck, CalendarCheck, CircleHelp, ClipboardCheck, Flame, Hourglass, Zap } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildReport } from "@/lib/reports";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/Progress";
import { PrintButton } from "@/components/reports/PrintButton";
import { SUBMISSION_STATUSES, SUBMISSION_TONES, TASK_TYPES } from "@/lib/constants";
import { cn, formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "تقرير الطالب", robots: { index: false, follow: false } };

const PERIODS = [
  [7, "آخر أسبوع"],
  [30, "آخر شهر"],
];

const TONES = {
  primary: "bg-primary-soft text-primary",
  mint: "bg-mint-soft text-mint",
  amber: "bg-amber-soft text-[#b86e00] dark:text-amber",
  sky: "bg-sky-soft text-sky",
  coral: "bg-coral-soft text-coral",
};

function Stat({ icon: IconCmp, label, value, tone = "primary" }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className={cn("mb-2 grid size-9 place-items-center rounded-xl", TONES[tone])}>
        <IconCmp className="size-4.5" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function Section({ title, children, className }) {
  return (
    <section className={cn("break-inside-avoid rounded-3xl border border-line bg-surface p-5 shadow-card print:shadow-none", className)}>
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

// Read-only report for parents. The secret token in the URL is the only key — no account needed.
export default async function ParentReportPage({ params, searchParams }) {
  const { token } = await params;
  const { days: rawDays } = await searchParams;
  const days = Number(rawDays) === 30 ? 30 : 7;
  if (!token || token.length < 20) notFound();

  const profile = await prisma.studentProfile.findUnique({ where: { reportToken: token }, select: { userId: true } });
  if (!profile) notFound();
  const r = await buildReport(profile.userId, days);
  if (!r) notFound();
  const p = r.period;

  return (
    <div className="min-h-dvh bg-bg px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <Logo size={34} />
          <div className="flex items-center gap-2 print:hidden">
            {PERIODS.map(([d, label]) => (
              <Link
                key={d}
                href={`?days=${d}`}
                className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition", d === days ? "bg-primary text-white" : "bg-surface-2 text-muted hover:text-fg")}
              >
                {label}
              </Link>
            ))}
            <PrintButton />
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#8B6CFF,#4F32E6)] p-6 text-white">
          <div className="absolute -end-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-wrap items-center gap-4">
            <Avatar name={r.student.name} color={r.student.avatarColor} avatar={r.student.avatar} size={64} className="ring-4 ring-white/25" />
            <div className="min-w-0 flex-1 basis-48">
              <div className="text-sm text-white/75">تقرير متابعة · {days === 7 ? "آخر 7 أيام" : "آخر 30 يومًا"}</div>
              <h1 className="mt-0.5 text-2xl font-bold sm:text-3xl">{r.student.name}</h1>
              <div className="mt-1 text-sm text-white/80">
                رتبة {r.rank} · طالب منذ {formatDate(r.student.joinedAt)}
                {r.student.groups.length > 0 && ` · ${r.student.groups.join("، ")}`}
              </div>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-2 text-center text-xs text-white/80">
              <div>من {formatDate(r.from)}</div>
              <div>إلى {formatDate(r.to)}</div>
            </div>
          </div>
        </section>

        {r.overdue > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-coral/30 bg-coral-soft p-4 text-sm text-coral">
            <AlertTriangle className="size-5 shrink-0" />
            لديه {formatNumber(r.overdue)} مهمة تجاوزت موعد التسليم — شجّعه على إكمالها 💪
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat icon={BookOpenCheck} label="دروس أكملها في الفترة" value={formatNumber(p.lessons.length)} tone="mint" />
          <Stat icon={CalendarCheck} label="أيام تعلّم في الفترة" value={`${formatNumber(p.activeDays)}/${formatNumber(days)}`} tone="sky" />
          <Stat icon={ClipboardCheck} label="مهام سلّمها أو قُيّمت" value={formatNumber(p.submissions.length)} />
          <Stat icon={CircleHelp} label="نتيجة الاختبارات في الفترة" value={p.quizPercent != null ? `${formatNumber(p.quizPercent)}%` : "—"} tone="amber" />
          <Stat icon={Flame} label="أيام متتالية (الأفضل)" value={`${formatNumber(r.streak)} (${formatNumber(r.bestStreak)})`} tone="coral" />
          <Stat icon={Zap} label="مجموع نقاط الخبرة" value={formatNumber(r.xp)} />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Section title="الدروس المكتملة">
            {p.lessons.length === 0 ? (
              <p className="text-sm text-muted">لم يكمل دروسًا في هذه الفترة.</p>
            ) : (
              <ul className="space-y-2">
                {p.lessons.slice(0, 12).map((l, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="size-1.5 shrink-0 rounded-full bg-mint" />
                    <span className="min-w-0 flex-1 truncate">{l.title}</span>
                    {l.quiz && (
                      <span className={cn("shrink-0 text-xs font-semibold", l.quiz.score === l.quiz.total ? "text-mint" : "text-muted")}>
                        {formatNumber(l.quiz.score)}/{formatNumber(l.quiz.total)}
                      </span>
                    )}
                  </li>
                ))}
                {p.lessons.length > 12 && <li className="text-xs text-muted">و{formatNumber(p.lessons.length - 12)} دروس أخرى</li>}
              </ul>
            )}
            <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
              المجموع منذ البداية: {formatNumber(r.totals.lessons)} درس
              {r.totals.quizPercent != null && ` · متوسط الاختبارات ${formatNumber(r.totals.quizPercent)}%`}
            </p>
          </Section>

          <Section title="المهام وملاحظات المعلّم">
            {p.submissions.length === 0 ? (
              <p className="text-sm text-muted">لا تسليمات في هذه الفترة.</p>
            ) : (
              <ul className="space-y-3">
                {p.submissions.slice(0, 6).map((s, i) => (
                  <li key={i} className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 basis-32 truncate font-medium">{s.title}</span>
                      {s.grade != null && <span className="text-xs font-semibold">{formatNumber(s.grade)}/100</span>}
                      <Badge tone={SUBMISSION_TONES[s.status]}>{SUBMISSION_STATUSES[s.status]}</Badge>
                    </div>
                    <div className="text-xs text-muted">
                      {TASK_TYPES[s.type]} · {formatDate(s.at)}
                    </div>
                    {s.feedback && (
                      <p className="mt-1 line-clamp-3 rounded-xl bg-surface-2 px-3 py-2 text-xs leading-6" dir="auto">
                        💬 {s.feedback}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
              مهام مقبولة منذ البداية: {formatNumber(r.totals.tasksApproved)}
              {r.totals.avgGrade != null && ` · متوسط الدرجات ${formatNumber(r.totals.avgGrade)}/100`}
            </p>
          </Section>
        </div>

        {r.courses.length > 0 && (
          <Section title="التقدّم في الدورات">
            <div className="grid gap-3 sm:grid-cols-2">
              {r.courses.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: c.color }}>
                    <Icon name={c.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{c.title}</span>
                      <span className="shrink-0 text-xs text-muted">{formatNumber(c.percent)}%</span>
                    </div>
                    <ProgressBar value={c.percent} color={c.color} size="sm" className="mt-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {(p.achievements.length > 0 || r.pending.length > 0) && (
          <div className="grid gap-5 md:grid-cols-2">
            {p.achievements.length > 0 && (
              <Section title="أوسمة جديدة 🏆">
                <div className="flex flex-wrap gap-2">
                  {p.achievements.map((a, i) => (
                    <span key={i} className="flex items-center gap-2 rounded-full border border-line py-1 pe-3 ps-1 text-sm">
                      <span className="grid size-7 place-items-center rounded-full text-white" style={{ background: a.color }}>
                        <Icon name={a.icon} className="size-3.5" />
                      </span>
                      {a.title}
                    </span>
                  ))}
                </div>
              </Section>
            )}
            {r.pending.length > 0 && (
              <Section title="مهام بانتظار التسليم">
                <ul className="space-y-2 text-sm">
                  {r.pending.map((t, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Hourglass className={cn("size-4 shrink-0", t.overdue ? "text-coral" : "text-amber")} />
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      {t.deadline && <span className={cn("shrink-0 text-xs", t.overdue ? "font-semibold text-coral" : "text-muted")}>{formatDate(t.deadline)}</span>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}

        <footer className="pb-6 pt-2 text-center text-xs text-muted">هذا التقرير خاص بطالبك ويُحدَّث تلقائيًا — لا تشارك الرابط مع أحد. · أكاديمية وَمِيض للبرمجة</footer>
      </div>
    </div>
  );
}
