import { requireStudent } from "@/lib/auth";
import { announceUnlocks } from "@/lib/access";
import { getShellStats } from "@/lib/student-data";
import { StudentShell } from "@/components/layout/StudentShell";

export default async function StudentLayout({ children }) {
  const user = await requireStudent();
  await announceUnlocks(user.id);
  const stats = await getShellStats(user);

  return (
    <StudentShell user={{ name: user.name, username: user.username, avatarColor: user.avatarColor, avatar: user.avatar }} stats={stats}>
      {children}
    </StudentShell>
  );
}
