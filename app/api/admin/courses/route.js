import { prisma } from "@/lib/db";
import { handler, parseBody } from "@/lib/api";
import { courseSchema } from "@/lib/validators";
import { nextOrder } from "@/lib/admin-data";

export const POST = handler({ role: "ADMIN" }, async ({ req }) => {
  const data = await parseBody(req, courseSchema);
  const course = await prisma.course.create({
    data: {
      ...data,
      order: data.order ?? (await nextOrder("course", { levelId: data.levelId })),
      modules: { create: { title: "الوحدة الأولى", order: 0 } },
    },
  });
  return { ok: true, id: course.id };
});
