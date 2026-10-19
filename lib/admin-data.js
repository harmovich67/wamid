import "server-only";
import { prisma } from "./db";
import { ruleKey } from "./access-rules";

// Full curriculum (including drafts) in the compact shape the admin pickers need.
// Four flat parallel queries stitched together: one round trip instead of four chained ones.
export async function getCurriculum() {
  const [levels, courses, modules, lessons] = await Promise.all([
    prisma.level.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true, color: true, icon: true } }),
    prisma.course.findMany({ orderBy: { order: "asc" }, select: { id: true, levelId: true, title: true, color: true, icon: true, isPublished: true } }),
    prisma.module.findMany({ orderBy: { order: "asc" }, select: { id: true, courseId: true, title: true } }),
    prisma.lesson.findMany({ orderBy: { order: "asc" }, select: { id: true, moduleId: true, title: true, isPublished: true } }),
  ]);
  const group = (rows, key) => {
    const map = new Map();
    for (const row of rows) (map.get(row[key]) ?? map.set(row[key], []).get(row[key])).push(row);
    return map;
  };
  const coursesByLevel = group(courses, "levelId");
  const modulesByCourse = group(modules, "courseId");
  const lessonsByModule = group(lessons, "moduleId");
  return levels.map((level) => ({
    ...level,
    courses: (coursesByLevel.get(level.id) ?? []).map(({ levelId, ...course }) => ({
      ...course,
      modules: (modulesByCourse.get(course.id) ?? []).map(({ courseId, ...mod }) => ({
        ...mod,
        lessons: (lessonsByModule.get(mod.id) ?? []).map(({ moduleId, ...lesson }) => lesson),
      })),
    })),
  }));
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
  if (!or.length) return;
  await prisma.accessRule.deleteMany({ where: { OR: or } });
  await prisma.studyGroupRule.deleteMany({ where: { OR: or } });
}

const sameTime = (a, b) => (a?.getTime?.() ?? null) === (b?.getTime?.() ?? null);

/**
 * Replaces the full rule set of a student (`model: "accessRule"`, owner `{ userId }`) or a class
 * (`model: "studyGroupRule"`, owner `{ groupId }`). Unchanged rules keep their "already announced"
 * marker; new or changed ones are announced again when a student next opens the app.
 */
export async function replaceRules(model, owner, rules) {
  const uniqueName = `${Object.keys(owner)[0]}_resourceType_resourceId`;
  const existing = await prisma[model].findMany({ where: owner });
  const byKey = new Map(existing.map((r) => [ruleKey(r.resourceType, r.resourceId), r]));
  const seen = new Set();

  await prisma.$transaction(async (tx) => {
    for (const rule of rules) {
      const key = ruleKey(rule.resourceType, rule.resourceId);
      if (seen.has(key)) continue;
      seen.add(key);
      const prev = byKey.get(key);
      const unchanged =
        prev && prev.effect === rule.effect && sameTime(prev.availableFrom, rule.availableFrom) && sameTime(prev.availableUntil, rule.availableUntil);
      if (unchanged) continue;
      const data = {
        effect: rule.effect,
        availableFrom: rule.availableFrom ?? null,
        availableUntil: rule.availableUntil ?? null,
        notifiedAt: null,
      };
      const ids = { ...owner, resourceType: rule.resourceType, resourceId: rule.resourceId };
      await tx[model].upsert({ where: { [uniqueName]: ids }, update: data, create: { ...data, ...ids } });
    }
    const removed = existing.filter((r) => !seen.has(ruleKey(r.resourceType, r.resourceId))).map((r) => r.id);
    if (removed.length) await tx[model].deleteMany({ where: { id: { in: removed } } });
  });
  return seen.size;
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
