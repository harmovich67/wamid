import "server-only";
import { prisma } from "./db";

// Full curriculum (including drafts) in the compact shape the admin pickers need.
export async function getCurriculum() {
  const levels = await prisma.level.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      color: true,
      icon: true,
      courses: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          color: true,
          icon: true,
          isPublished: true,
          modules: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, isPublished: true } },
            },
          },
        },
      },
    },
  });
  return levels;
}

export async function getTaskOptions() {
  return prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, type: true, courseId: true, lessonId: true, isPublished: true },
  });
}

export function serializeRules(rules) {
  return rules.map((r) => ({
    resourceType: r.resourceType,
    resourceId: r.resourceId,
    effect: r.effect,
    availableFrom: r.availableFrom?.toISOString() ?? null,
    availableUntil: r.availableUntil?.toISOString() ?? null,
  }));
}

// Access rules have no foreign keys (they point at several tables), so clean them up on delete.
export async function deleteRulesFor(targets) {
  const or = Object.entries(targets)
    .filter(([, ids]) => ids?.length)
    .map(([resourceType, ids]) => ({ resourceType, resourceId: { in: ids } }));
  if (or.length) await prisma.accessRule.deleteMany({ where: { OR: or } });
}

export async function nextOrder(model, where) {
  const last = await prisma[model].findFirst({ where, orderBy: { order: "desc" }, select: { order: true } });
  return (last?.order ?? -1) + 1;
}

export function taskData(data) {
  const { skills, attachments, ...rest } = data;
  return {
    ...rest,
    ...(skills ? { skills: JSON.stringify(skills) } : {}),
    ...(attachments ? { attachments: JSON.stringify(attachments) } : {}),
  };
}
