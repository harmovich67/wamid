import { z } from "zod";
import { prisma } from "@/lib/db";
import { ApiError, handler, notFound, parseBody } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { generateLesson, generateOutline, generateQuiz, generateTask } from "@/lib/ai-author";
import { CODE_LANGUAGES, TASK_DIFFICULTIES, TASK_TYPES } from "@/lib/constants";

const audience = z.enum(["kids", "teens", "adults"]).default("teens");
const topic = z.string().trim().min(3, "اكتب الموضوع (3 أحرف على الأقل)").max(500);
const notes = z.string().trim().max(1500).optional().default("");

const SCHEMAS = {
  lesson: z.object({
    topic,
    audience,
    depth: z.enum(["short", "standard", "deep"]).default("standard"),
    language: z.enum(CODE_LANGUAGES).default("python"),
    quizCount: z.number().int().min(0).max(8).default(3),
    notes,
    lessonId: z.string().optional(),
  }),
  quiz: z.object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(20, "أضف محتوى للدرس أولًا ليُبنى عليه الاختبار").max(60000),
    count: z.number().int().min(1).max(8).default(4),
    audience,
  }),
  task: z.object({
    topic,
    type: z.enum(Object.keys(TASK_TYPES)).default("TASK"),
    difficulty: z.enum(Object.keys(TASK_DIFFICULTIES)).default("MEDIUM"),
    audience,
    notes,
    courseId: z.string().optional().nullable(),
    lessonId: z.string().optional().nullable(),
  }),
  outline: z.object({
    topic,
    audience,
    modules: z.number().int().min(1).max(8).default(3),
    lessonsPerModule: z.number().int().min(1).max(8).default(4),
    notes,
    courseId: z.string().optional(),
  }),
};

async function lessonContext(lessonId) {
  if (!lessonId) return null;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      order: true,
      module: {
        select: {
          title: true,
          lessons: { orderBy: { order: "asc" }, select: { title: true, order: true } },
          course: { select: { title: true, level: { select: { title: true } } } },
        },
      },
    },
  });
  if (!lesson) return null;
  const before = lesson.module.lessons.filter((l) => l.order < lesson.order).map((l) => l.title);
  return `دورة "${lesson.module.course.title}" (مستوى: ${lesson.module.course.level.title})، وحدة "${lesson.module.title}".${
    before.length ? ` الدروس السابقة: ${before.join("، ")} — ابنِ عليها ولا تكررها.` : " هذا أول درس في الوحدة."
  }`;
}

export const POST = handler({ role: "ADMIN" }, async ({ req, user, params }) => {
  const schema = SCHEMAS[params.kind];
  if (!schema) throw notFound();
  const limit = rateLimit(`ai-author:${user.id}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) throw new ApiError(429, "طلبات توليد كثيرة، انتظر قليلًا");
  const input = await parseBody(req, schema);

  switch (params.kind) {
    case "lesson":
      return generateLesson({ ...input, context: await lessonContext(input.lessonId) });
    case "quiz":
      return generateQuiz(input);
    case "task": {
      let context = null;
      if (input.lessonId) context = await lessonContext(input.lessonId);
      else if (input.courseId) {
        const c = await prisma.course.findUnique({ where: { id: input.courseId }, select: { title: true, description: true } });
        if (c) context = `مهمة لدورة "${c.title}"${c.description ? `: ${c.description}` : ""}`;
      }
      return generateTask({ ...input, context });
    }
    case "outline": {
      let context = null;
      if (input.courseId) {
        const c = await prisma.course.findUnique({
          where: { id: input.courseId },
          select: { title: true, level: { select: { title: true } }, modules: { select: { title: true, lessons: { select: { title: true } } } } },
        });
        const existing = c?.modules.flatMap((m) => m.lessons.map((l) => l.title)) ?? [];
        if (c) context = `دورة "${c.title}" في مستوى "${c.level.title}".${existing.length ? ` دروس موجودة مسبقًا (لا تكررها): ${existing.join("، ")}` : ""}`;
      }
      return generateOutline({ ...input, context });
    }
  }
});

