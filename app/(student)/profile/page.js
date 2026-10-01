import { requireStudent } from "@/lib/auth";
import { studentStats } from "@/lib/rewards";
import { rankFor } from "@/lib/gamification";
import { PageHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileForm } from "@/components/shared/ProfileForm";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata = { title: "الملف الشخصي" };

export default async function ProfilePage() {
  const user = await requireStudent();
  const stats = await studentStats(user.id);
  const rank = rankFor(stats.xp);

  const items = [
    ["نقاط الخبرة", `${formatNumber(stats.xp)} XP`],
    ["الرتبة", rank.current.title],
    ["دروس مكتملة", formatNumber(stats.lessonsCompleted)],
    ["دورات مكتملة", formatNumber(stats.coursesCompleted)],
    ["مهام مقبولة", formatNumber(stats.tasksApproved)],
    ["أفضل سلسلة", `${formatNumber(stats.streak)} يوم`],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="الملف الشخصي" />
      <section className="flex flex-col items-center gap-4 rounded-[2rem] border border-line bg-surface p-6 text-center shadow-card sm:flex-row sm:text-start">
        <Avatar name={user.name} color={user.avatarColor} avatar={user.avatar} size={80} />
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <div className="text-muted" dir="ltr">@{user.username}</div>
          <div className="mt-1 text-sm text-muted">عضو منذ {formatDate(user.createdAt)}</div>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-1 text-xl font-bold">{value}</div>
          </div>
        ))}
      </section>
      <ProfileForm user={{ name: user.name, avatarColor: user.avatarColor, avatar: user.avatar }} />
    </div>
  );
}
