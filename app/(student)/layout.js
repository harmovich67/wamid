import { requireStudentWithData, getShellStats } from "@/lib/student-data";
import { StudentShell } from "@/components/layout/StudentShell";

export default async function StudentLayout({ children }) {
  // New unlocks are announced by the bell's first poll (which runs right after load), so the page never waits for them.
  const user = await requireStudentWithData({ shell: true });
  const stats = await getShellStats(user);

  return (
    <StudentShell user={{ name: user.name, username: user.username, avatarColor: user.avatarColor, avatar: user.avatar }} stats={stats}>
      {children}
    </StudentShell>
  );
}
