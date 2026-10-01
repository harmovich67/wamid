import { requireAdmin } from "@/lib/auth";
import { getCurriculum } from "@/lib/admin-data";
import { TaskForm } from "@/components/admin/TaskForm";

export const metadata = { title: "مهمة جديدة" };

export default async function NewTaskPage() {
  await requireAdmin();
  const levels = await getCurriculum();
  return <TaskForm levels={levels} />;
}
