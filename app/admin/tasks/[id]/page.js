import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCurriculum } from "@/lib/admin-data";
import { TaskForm } from "@/components/admin/TaskForm";
import { parseJSON } from "@/lib/utils";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const t = await prisma.task.findUnique({ where: { id }, select: { title: true } });
  return { title: t?.title ?? "مهمة" };
}

export default async function EditTaskPage({ params }) {
  const { id } = await params;
  await requireAdmin();
  const [task, levels, students, assigned] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: {
        submissions: {
          orderBy: { submittedAt: "desc" },
          include: { student: { select: { name: true, avatarColor: true } } },
        },
      },
    }),
    getCurriculum(),
    prisma.user.findMany({ where: { role: "STUDENT" }, orderBy: { name: "asc" }, select: { id: true, name: true, username: true, avatarColor: true } }),
    prisma.accessRule.findMany({ where: { resourceType: "TASK", resourceId: id, effect: "ALLOW" }, select: { userId: true } }),
  ]);
  if (!task) notFound();

  return (
    <TaskForm
      levels={levels}
      students={students}
      assigned={assigned.map((a) => a.userId)}
      submissions={task.submissions.map((s) => ({
        id: s.id,
        status: s.status,
        grade: s.grade,
        submittedAt: s.submittedAt.toISOString(),
        student: s.student,
      }))}
      task={{
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        difficulty: task.difficulty,
        skills: parseJSON(task.skills, []),
        attachments: parseJSON(task.attachments, []),
        deadline: task.deadline?.toISOString() ?? null,
        points: task.points,
        courseId: task.courseId ?? "",
        lessonId: task.lessonId ?? "",
        isPublished: task.isPublished,
      }}
    />
  );
}
