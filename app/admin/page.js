import Link from "next/link";
import {
  AlertCircle, ArrowDownRight, ArrowLeft, ArrowUpRight, BookOpenCheck, Bot, ClipboardCheck, KeyRound, Moon, Plus, UserPlus, Users, Zap,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/Progress";
import { ActivityChart } from "@/components/admin/ActivityChart";
import { rankFor } from "@/lib/gamification";
import { TASK_TYPES } from "@/lib/constants";
import { cn, dayKey, daysAgo, formatNumber, timeAgo } from "@/lib/utils";

const longDate = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", day: "numeric", month: "long" });

function Delta({ now, before }) {
  if (!before && !now) return <span className="text-xs text-muted">لا نشاط بعد</span>;
  const diff = before ? Math.round(((now - before) / before) * 100) : 100;
  const up = diff >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-mint" : "text-coral")}>
      {up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {formatNumber(Math.abs(diff))}% <span className="font-normal text-muted">عن الأسبوع الماضي</span>
    </span>
  );
}

function Kpi({ icon: IconCmp, label, value, tone, children }) {
  const tones = { primary: "bg-primary-soft text-primary", mint: "bg-mint-soft text-mint", amber: "bg-amber-soft text-amber", coral: "bg-coral-soft text-coral", sky: "bg-sky-soft text-sky" };
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className={cn("grid size-8 place-items-center rounded-lg", tones[tone])}>
          <IconCmp className="size-4" />
        </span>
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 min-h-4">{children}</div>
    </div>
  );
}

function Panel({ title, subtitle, action, children, className }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface shadow-card", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default async function AdminHome() {
  const user = await requireAdmin();
  const weekAgo = daysAgo(7);
  const twoWeeksAgo = daysAgo(14);

  const [students, progress, pendingSubs, pendingCount, aiThisWeek, aiLastWeek, courses, top] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT", isActive: true },
      select: { id: true, name: true, avatarColor: true, lastLoginAt: true, createdAt: true, student: true, _count: { select: { accessRules: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { completedAt: { gte: twoWeeksAgo } },
      select: { userId: true, completedAt: true, lesson: { select: { title: true } }, user: { select: { name: true, avatarColor: true } } },
      orderBy: { completedAt: "desc" },
    }),
    prisma.submission.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { submittedAt: "asc" },
      take: 5,
      include: { student: { select: { name: true, avatarColor: true } }, task: { select: { title: true, type: true } } },
    }),
    prisma.submission.count({ where: { status: "SUBMITTED" } }),
    prisma.aIMessage.count({ where: { role: "user", createdAt: { gte: weekAgo } } }),
    prisma.aIMessage.count({ where: { role: "user", createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.course.findMany({
      where: { isPublished: true },
      orderBy: [{ level: { order: "asc" } }, { order: "asc" }],
      select: {
        id: true, title: true, icon: true, color: true,
        modules: { select: { lessons: { where: { isPublished: true }, select: { id: true, _count: { select: { progress: { where: { completedAt: { not: null } } } } } } } } },
      },
    }),
    prisma.studentProfile.findMany({
      orderBy: { xp: "desc" },
      take: 5,
      where: { user: { isActive: true } },
      include: { user: { select: { id: true, name: true, avatarColor: true } } },
    }),
  ]);

  // Weekly comparisons.
  const thisWeek = progress.filter((p) => p.completedAt >= weekAgo);
  const lastWeek = progress.filter((p) => p.completedAt < weekAgo);
  const learnersNow = new Set(thisWeek.map((p) => p.userId)).size;
  const learnersBefore = new Set(lastWeek.map((p) => p.userId)).size;

  // 14-day series (local days).
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = daysAgo(13 - i);
    return { date: dayKey(d), value: 0 };
  });
  const byDay = new Map(series.map((s) => [s.date, s]));
  for (const p of progress) {
    const s = byDay.get(dayKey(p.completedAt));
    if (s) s.value += 1;
  }

  // Course engagement: completions / (lessons × active students).
  const courseRows = courses
    .map((c) => {
      const lessons = c.modules.flatMap((m) => m.lessons);
      const completions = lessons.reduce((s, l) => s + l._count.progress, 0);
      return { ...c, lessons: lessons.length, completions };
    })
    .filter((c) => c.lessons > 0)
    .sort((a, b) => b.completions - a.completions)
    .slice(0, 5);
  const maxCompletions = Math.max(1, ...courseRows.map((c) => c.completions));

  // Students who need attention.
  const today = dayKey(new Date());
  const attention = students
    .map((s) => {
      if (!s._count.accessRules) return { ...s, reason: "لم يُفتح له أي محتوى", icon: KeyRound, tone: "amber" };
      const last = s.student?.lastActiveDate;
      if (!last) return { ...s, reason: "لم يبدأ التعلّم بعد", icon: Moon, tone: "sky" };
      const idle = Math.round((new Date(today) - new Date(last)) / 86400000);
      if (idle >= 5) return { ...s, reason: `غائب منذ ${formatNumber(idle)} أيام`, icon: AlertCircle, tone: "coral" };
      return null;
    })
    .filter(Boolean)
    .slice(0, 5);

  const firstName = user.name.split(" ")[0];
  const summary = [
    pendingCount ? `${formatNumber(pendingCount)} تسليم بانتظار مراجعتك` : "لا توجد تسليمات معلّقة",
    `${formatNumber(learnersNow)} من ${formatNumber(students.length)} طلاب تعلّموا هذا الأسبوع`,
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-7">
        <div className="absolute -top-24 end-0 size-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm text-muted">{longDate.format(new Date())}</div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">أهلًا {firstName} 👋</h1>
            <ul className="mt-3 flex flex-wrap gap-2 text-sm">
              {summary.map((s) => (
                <li key={s} className="rounded-full bg-surface-2 px-3 py-1 text-muted">{s}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingCount > 0 && (
              <Button href="/admin/submissions" variant="soft">
                <ClipboardCheck className="size-4" /> راجع التسليمات
              </Button>
            )}
            <Button href="/admin/students?new=1" variant="secondary">
              <UserPlus className="size-4" /> طالب جديد
            </Button>
            <Button href="/admin/tasks/new">
              <Plus className="size-4" /> مهمة جديدة
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi icon={Users} label="متعلّمون نشطون" value={formatNumber(learnersNow)} tone="primary">
          <Delta now={learnersNow} before={learnersBefore} />
        </Kpi>
        <Kpi icon={BookOpenCheck} label="دروس مكتملة (7 أيام)" value={formatNumber(thisWeek.length)} tone="mint">
          <Delta now={thisWeek.length} before={lastWeek.length} />
        </Kpi>
        <Kpi icon={ClipboardCheck} label="بانتظار المراجعة" value={formatNumber(pendingCount)} tone={pendingCount ? "coral" : "sky"}>
          <span className="text-xs text-muted">{pendingSubs[0] ? `الأقدم ${timeAgo(pendingSubs[0].submittedAt)}` : "كل شيء تمت مراجعته"}</span>
        </Kpi>
        <Kpi icon={Bot} label="أسئلة للمساعد الذكي" value={formatNumber(aiThisWeek)} tone="amber">
          <Delta now={aiThisWeek} before={aiLastWeek} />
        </Kpi>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="نشاط التعلّم" subtitle="الدروس المكتملة يوميًا — آخر 14 يومًا" className="xl:col-span-2">
          <div className="ps-6">
            <ActivityChart data={series} />
          </div>
        </Panel>

        <Panel
          title="يحتاجون انتباهك"
          subtitle="طلاب غائبون أو بلا محتوى"
          action={<Link href="/admin/students" className="text-sm font-medium text-primary">الطلاب</Link>}
        >
          {attention.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">كل الطلاب على المسار الصحيح 🎯</p>
          ) : (
            <div className="space-y-1">
              {attention.map((s) => (
                <Link key={s.id} href={`/admin/students/${s.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-2">
                  <Avatar name={s.name} color={s.avatarColor} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted">{s.reason}</div>
                  </div>
                  <Badge tone={s.tone} icon={s.icon}>تابِع</Badge>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="تسليمات تنتظر مراجعتك"
          subtitle="الأقدم أولًا"
          className="xl:col-span-2"
          action={
            <Link href="/admin/submissions" className="flex items-center gap-1 text-sm font-medium text-primary">
              الكل <ArrowLeft className="size-4" />
            </Link>
          }
        >
          {pendingSubs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">لا شيء للمراجعة 🎉</p>
          ) : (
            <div className="divide-y divide-line">
              {pendingSubs.map((s) => (
                <Link key={s.id} href={`/admin/submissions/${s.id}`} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={s.student.name} color={s.student.avatarColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium group-hover:text-primary">{s.task.title}</div>
                    <div className="text-xs text-muted">{s.student.name} · {timeAgo(s.submittedAt)}</div>
                  </div>
                  <Badge tone="primary">{TASK_TYPES[s.task.type]}</Badge>
                  <ArrowLeft className="size-4 text-muted transition group-hover:-translate-x-1" />
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="المتصدّرون" subtitle="حسب نقاط الخبرة">
          <div className="space-y-1">
            {top.length === 0 && <p className="text-center text-sm text-muted">لا يوجد طلاب بعد.</p>}
            {top.map((p, i) => (
              <Link key={p.id} href={`/admin/students/${p.user.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-2">
                <span className={cn("grid size-6 place-items-center rounded-full text-xs font-bold", i === 0 ? "bg-amber text-[#3a2400]" : "bg-surface-2 text-muted")}>{formatNumber(i + 1)}</span>
                <Avatar name={p.user.name} color={p.user.avatarColor} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.user.name}</div>
                  <div className="text-xs text-muted">{rankFor(p.xp).current.title}</div>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <Zap className="size-3.5 text-primary" /> {formatNumber(p.xp)}
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="الدورات الأكثر نشاطًا" subtitle="عدد الدروس التي أكملها الطلاب في كل دورة" action={<Link href="/admin/curriculum" className="text-sm font-medium text-primary">المسار</Link>}>
          {courseRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">لا نشاط بعد.</p>
          ) : (
            <div className="space-y-4">
              {courseRows.map((c) => (
                <Link key={c.id} href={`/admin/courses/${c.id}`} className="flex items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: c.color }}>
                    <Icon name={c.icon} className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{c.title}</span>
                      <span className="shrink-0 text-xs text-muted">{formatNumber(c.completions)} إكمال · {formatNumber(c.lessons)} دروس</span>
                    </div>
                    <ProgressBar value={(c.completions / maxCompletions) * 100} size="sm" color="var(--primary)" className="mt-1.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="آخر النشاطات" subtitle="دروس أكملها الطلاب مؤخرًا">
          {progress.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">لا نشاط بعد.</p>
          ) : (
            <ol className="relative space-y-4 before:absolute before:inset-y-2 before:start-[15px] before:w-px before:bg-line">
              {progress.slice(0, 6).map((p, i) => (
                <li key={i} className="relative flex items-center gap-3">
                  <Avatar name={p.user.name} color={p.user.avatarColor} size={32} className="ring-4 ring-surface" />
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{p.user.name}</span> <span className="text-muted">أكمل</span> <span className="font-medium">{p.lesson.title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(p.completedAt)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
