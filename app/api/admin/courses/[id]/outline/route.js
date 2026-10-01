import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, notFound, parseBody } from "@/lib/api";
import { nextOrder } from "@/lib/admin-data";

const schema = z.object({
  modules: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        lessons: z.array(z.object({ title: z.string().trim().min(1).max(160), summary: z.string().trim().max(500).optional() })).min(1).max(20),
      })
    )
    .min(1)
    .max(12),
});

// Adds an approved AI outline to a course: new modules with draft lessons (titles + summaries).
export const POST = handler({ role: "ADMIN" }, async ({ req, params }) => {
  const course = await prisma.course.findUnique({ where: { id: params.id } });
  if (!course) throw notFound("الدورة غير موجودة");
  const { modules } = await parseBody(req, schema);
  let order = await nextOrder("module", { courseId: course.id });
  let lessons = 0;
  await prisma.$transaction(async (tx) => {
    for (const m of modules) {
      await tx.module.create({
        data: {
          courseId: course.id,
          title: m.title,
          order: order++,
          lessons: { create: m.lessons.map((l, i) => ({ title: l.title, summary: l.summary || null, order: i, isPublished: false })) },
        },
      });
      lessons += m.lessons.length;
    }
  });
  return { ok: true, modules: modules.length, lessons };
});
