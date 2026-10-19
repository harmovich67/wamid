import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { notify } from "./notify";
import { CURRICULUM_TAG } from "./cache-tags";
import { STATES, mergeGroupRules, resolveChain, ruleKey, withGroupRules } from "./access-rules";

/*
 * Permission engine.
 *
 * Students only see what the teacher assigned. For any piece of content we walk from the most
 * specific rule to the least specific one and the first rule found decides:
 *
 *   LESSON → MODULE → COURSE → LEVEL → (nothing) = locked "unassigned"
 *
 * A rule is ALLOW or DENY, optionally bounded by availableFrom / availableUntil.
 * Rules come from the student and from every class (study group) they belong to; at the same item
 * the student's own rule wins, and between classes the most generous rule wins.
 * Course.sequential then adds "finish the previous lesson first" gating on top.
 */

export { STATES };

// Runs fn over items a few at a time: much faster than one by one against a remote database,
// without opening a connection per student.
async function mapChunked(items, fn, size = 8) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

/** Rules of every class the student belongs to, tagged with the class name. */
export async function loadGroupRules(userId) {
  // Class names come from a tiny cached table, so this is a single query instead of a rule query plus a chained include.
  const [rows, names] = await Promise.all([
    prisma.studyGroupRule.findMany({ where: { group: { members: { some: { userId } } } } }),
    loadGroupNames(),
  ]);
  return rows.map((r) => ({ ...r, group: names.get(r.groupId) ?? "" }));
}

export async function loadRules(userId) {
  const now = new Date();
  const [rules, groupRules] = await Promise.all([prisma.accessRule.findMany({ where: { userId } }), loadGroupRules(userId)]);
  const own = new Map(rules.map((r) => [ruleKey(r.resourceType, r.resourceId), r]));
  return { map: withGroupRules(own, mergeGroupRules(groupRules, now)), own, now };
}

export function resolve(rules, chain) {
  return resolveChain(rules.map, chain, rules.now);
}

// The published curriculum is identical for every student, so it is loaded as four flat parallel
// queries (one round trip instead of a chained include) and stitched together here.
async function fetchCurriculum() {
  const [levels, courses, modules, lessons] = await Promise.all([
    prisma.level.findMany({
      orderBy: { order: "asc" },
      select: { id: true, order: true, title: true, subtitle: true, description: true, color: true, icon: true },
    }),
    prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      select: { id: true, levelId: true, title: true, description: true, icon: true, color: true, difficulty: true, sequential: true },
    }),
    prisma.module.findMany({ orderBy: { order: "asc" }, select: { id: true, courseId: true, title: true, order: true } }),
    prisma.lesson.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      select: { id: true, moduleId: true, title: true, summary: true, order: true, xpReward: true, durationMin: true },
    }),
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
    courses: (coursesByLevel.get(level.id) ?? []).map((course) => ({
      ...course,
      modules: (modulesByCourse.get(course.id) ?? []).map((mod) => ({
        ...mod,
        lessons: (lessonsByModule.get(mod.id) ?? []).map(({ moduleId, ...lesson }) => lesson),
      })),
    })),
  }));
}

async function fetchGroupNames() {
  const groups = await prisma.studyGroup.findMany({ select: { id: true, name: true } });
  return Object.fromEntries(groups.map((g) => [g.id, g.name]));
}
const loadGroupNamesObject =
  process.env.NODE_ENV === "production"
    ? unstable_cache(fetchGroupNames, ["group-names"], { tags: [CURRICULUM_TAG], revalidate: 300 })
    : fetchGroupNames;
const loadGroupNames = async () => new Map(Object.entries(await loadGroupNamesObject()));

// Cached across requests and instances; any admin write clears it (see handler() in lib/api.js).
// Skipped in development so re-seeding the database is never masked by a stale cache.
export const loadCurriculum =
  process.env.NODE_ENV === "production"
    ? unstable_cache(fetchCurriculum, ["student-curriculum"], { tags: [CURRICULUM_TAG], revalidate: 300 })
    : fetchCurriculum;

/**
 * Builds the full roadmap as this student sees it: every level, course, module and lesson with
 * its access state and completion. The curriculum is small (hundreds of lessons at most), so
 * computing it in one pass per request is simpler and safer than caching.
 */
export async function buildStudentTree(userId) {
  const [levels, rules, progress] = await Promise.all([
    loadCurriculum(),
    loadRules(userId),
    prisma.lessonProgress.findMany({ where: { userId }, select: { lessonId: true, completedAt: true, quizScore: true, quizTotal: true } }),
  ]);
  const done = new Map(progress.map((p) => [p.lessonId, p]));
  const lessonIndex = new Map();

  const outLevels = levels.map((level) => {
    const courses = level.courses.map((course) => {
      const courseAccess = resolve(rules, [["COURSE", course.id], ["LEVEL", level.id]]);
      let prevCompleted = true;
      let total = 0;
      let completed = 0;
      let openCount = 0;
      let scheduledAt = null;
      let nextLesson = null;

      const modules = course.modules.map((mod) => {
        const lessons = mod.lessons.map((lesson) => {
          let access = resolve(rules, [
            ["LESSON", lesson.id],
            ["MODULE", mod.id],
            ["COURSE", course.id],
            ["LEVEL", level.id],
          ]);
          const isDone = Boolean(done.get(lesson.id)?.completedAt);
          if (access.open) {
            if (course.sequential && !prevCompleted && !isDone) {
              access = { open: false, state: STATES.sequential };
            }
            prevCompleted = isDone;
          }
          total += 1;
          if (isDone) completed += 1;
          if (access.open) openCount += 1;
          if (access.state === STATES.scheduled && (!scheduledAt || access.opensAt < scheduledAt)) {
            scheduledAt = access.opensAt;
          }
          if (access.open && !isDone && !nextLesson) nextLesson = { ...lesson, moduleTitle: mod.title };
          const node = { ...lesson, access, completed: isDone, progress: done.get(lesson.id) ?? null };
          lessonIndex.set(lesson.id, { lesson: node, module: mod, course, level });
          return node;
        });
        return { id: mod.id, title: mod.title, order: mod.order, lessons };
      });

      // A course is visible when the student can open at least one lesson in it (or will soon),
      // or when the course itself is assigned (even if it has no lessons yet).
      const visible = openCount > 0 || scheduledAt || courseAccess.open || completed > 0;
      const state = openCount > 0 || courseAccess.open ? STATES.open : scheduledAt ? STATES.scheduled : completed > 0 ? STATES.open : courseAccess.state;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        icon: course.icon,
        color: course.color,
        difficulty: course.difficulty,
        sequential: course.sequential,
        courseAccess,
        visible: Boolean(visible),
        state,
        scheduledAt,
        total,
        completed,
        percent: total ? Math.round((completed / total) * 100) : 0,
        nextLesson,
        modules,
      };
    });
    const total = courses.reduce((s, c) => s + c.total, 0);
    const completed = courses.reduce((s, c) => s + c.completed, 0);
    return {
      id: level.id,
      order: level.order,
      title: level.title,
      subtitle: level.subtitle,
      description: level.description,
      color: level.color,
      icon: level.icon,
      courses,
      total,
      completed,
      unlocked: courses.some((c) => c.visible),
    };
  });

  return { levels: outLevels, lessonIndex, rules };
}

export async function getLessonAccess(userId, lessonId) {
  const tree = await buildStudentTree(userId);
  return { entry: tree.lessonIndex.get(lessonId) ?? null, tree };
}

/**
 * Tasks the student can see. An explicit TASK rule wins; otherwise a task inherits from its lesson
 * (must be open), then from its course (course-level assignment). Unlinked tasks need a TASK rule.
 */
export async function getStudentTasks(userId, treeOrPromise) {
  // Flat parallel queries instead of a chained include. They run while the roadmap is still being built; `treeOrPromise` may be a tree, a promise of one, or omitted.
  const [tree, rows, submissions] = await Promise.all([
    treeOrPromise ?? buildStudentTree(userId),
    prisma.task.findMany({ where: { isPublished: true }, orderBy: [{ deadline: "asc" }, { createdAt: "desc" }] }),
    prisma.submission.findMany({ where: { studentId: userId } }),
  ]);
  // Course/lesson labels come from the (cached) published curriculum: an unpublished course or lesson simply has no label.
  const courseById = new Map(tree.levels.flatMap((l) => l.courses).map((c) => [c.id, { id: c.id, title: c.title, levelId: c.levelId, color: c.color, isPublished: true }]));
  const lessonById = new Map([...tree.lessonIndex].map(([id, e]) => [id, { id, title: e.lesson.title }]));
  const submissionByTask = new Map(submissions.map((sub) => [sub.taskId, sub]));
  const tasks = rows.map((task) => ({
    ...task,
    course: courseById.get(task.courseId) ?? null,
    lesson: lessonById.get(task.lessonId) ?? null,
    submissions: submissionByTask.has(task.id) ? [submissionByTask.get(task.id)] : [],
  }));

  const out = [];
  for (const task of tasks) {
    let access = resolve(tree.rules, [["TASK", task.id]]);
    if (access.state === STATES.unassigned) {
      if (task.lessonId) {
        access = tree.lessonIndex.get(task.lessonId)?.lesson.access ?? access;
      } else if (task.courseId && task.course?.isPublished) {
        access = resolve(tree.rules, [["COURSE", task.courseId], ["LEVEL", task.course.levelId]]);
      }
    }
    const submission = task.submissions[0] ?? null;
    if (access.open || access.state === STATES.scheduled || submission) {
      out.push({ ...task, submission, access });
    }
  }
  return out;
}

export async function canAccessTask(userId, taskId) {
  const tasks = await getStudentTasks(userId);
  const task = tasks.find((t) => t.id === taskId);
  return task ?? null;
}

async function resourceTitle(type, id) {
  const select = { title: true };
  const model = { LEVEL: prisma.level, COURSE: prisma.course, MODULE: prisma.module, LESSON: prisma.lesson, TASK: prisma.task }[type];
  const row = await model?.findUnique({ where: { id }, select }).catch(() => null);
  return row?.title ?? null;
}

const UNLOCK_COPY = {
  LEVEL: { verb: "مستوى جديد مفتوح", link: () => "/roadmap" },
  COURSE: { verb: "دورة جديدة مفتوحة", link: (id) => `/courses/${id}` },
  MODULE: { verb: "وحدة جديدة مفتوحة", link: () => "/roadmap" },
  LESSON: { verb: "درس جديد مفتوح", link: (id) => `/lessons/${id}` },
  TASK: { verb: "مهمة جديدة لك", link: (id) => `/tasks/${id}` },
};

// Announcing is idempotent but costs a few queries, and it is triggered by every poll of the bell,
// so each instance checks a given student at most once per window.
const ANNOUNCE_EVERY_MS = 10_000;
const lastChecked = new Map();

/**
 * Lazily announces rules that became active (immediately-active rules and scheduled rules whose
 * date arrived). Called when the student's bell polls, so no cron job is needed.
 */
export async function announceUnlocks(userId) {
  const now = new Date();
  if (now - (lastChecked.get(userId) ?? 0) < ANNOUNCE_EVERY_MS) return;
  if (lastChecked.size > 1000) lastChecked.clear();
  lastChecked.set(userId, +now);
  await Promise.all([announcePersonalUnlocks(userId, now), announceGroupUnlocks(userId, now)]);
}

async function announcePersonalUnlocks(userId, now) {
  const pending = await prisma.accessRule.findMany({
    where: {
      userId,
      effect: "ALLOW",
      notifiedAt: null,
      OR: [{ availableFrom: null }, { availableFrom: { lte: now } }],
    },
  });
  await Promise.all(
    pending.map(async (rule) => {
      // Claim the rule first so two overlapping requests don't both announce it.
      const claimed = await prisma.accessRule.updateMany({ where: { id: rule.id, notifiedAt: null }, data: { notifiedAt: now } });
      if (!claimed.count || (rule.availableUntil && rule.availableUntil < now)) return;
      const title = await resourceTitle(rule.resourceType, rule.resourceId);
      const copy = UNLOCK_COPY[rule.resourceType];
      if (title && copy) {
        await notify(userId, {
          type: rule.resourceType === "TASK" ? "TASK_ASSIGNED" : "LESSON_UNLOCKED",
          title: `${copy.verb}: ${title}`,
          link: copy.link(rule.resourceId),
        });
      }
    })
  );
}

/**
 * Class rules are announced once, to every member who can actually open the item (a personal DENY
 * still wins). Triggered by whichever member loads the app first after the rule becomes active.
 */
async function announceGroupUnlocks(userId, now) {
  const pending = await prisma.studyGroupRule.findMany({
    where: {
      effect: "ALLOW",
      notifiedAt: null,
      OR: [{ availableFrom: null }, { availableFrom: { lte: now } }],
      group: { members: { some: { userId } } },
    },
    include: { group: { select: { members: { where: { user: { isActive: true } }, select: { userId: true } } } } },
  });
  await Promise.all(
    pending.map(async (rule) => {
      // Claim the rule first so two members loading at once don't both announce it.
      const claimed = await prisma.studyGroupRule.updateMany({ where: { id: rule.id, notifiedAt: null }, data: { notifiedAt: now } });
      if (!claimed.count || (rule.availableUntil && rule.availableUntil < now)) return;
      const title = await resourceTitle(rule.resourceType, rule.resourceId);
      const copy = UNLOCK_COPY[rule.resourceType];
      if (!title || !copy) return;
      await mapChunked(rule.group.members, async ({ userId: memberId }) => {
        const rules = await loadRules(memberId);
        if (!resolve(rules, [[rule.resourceType, rule.resourceId]]).open) return;
        await notify(memberId, {
          type: rule.resourceType === "TASK" ? "TASK_ASSIGNED" : "LESSON_UNLOCKED",
          title: `${copy.verb}: ${title}`,
          link: copy.link(rule.resourceId),
        });
      });
    })
  );
}

/**
 * Notifies every active student who can currently see a lesson that the teacher edited it —
 * only called when the teacher explicitly opts in on save, to avoid spamming minor edits.
 */
export async function notifyLessonAudience(lessonId) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, title: true, moduleId: true, module: { select: { courseId: true, course: { select: { levelId: true } } } } },
  });
  if (!lesson) return 0;
  const chain = [["LESSON", lesson.id], ["MODULE", lesson.moduleId], ["COURSE", lesson.module.courseId], ["LEVEL", lesson.module.course.levelId]];
  const students = await prisma.user.findMany({ where: { role: "STUDENT", isActive: true }, select: { id: true } });
  const sent = await mapChunked(students, async (s) => {
    const rules = await loadRules(s.id);
    if (!resolve(rules, chain).open) return false;
    await notify(s.id, { type: "LESSON_UPDATED", title: `تحديث على الدرس: ${lesson.title}`, link: `/lessons/${lesson.id}` });
    return true;
  });
  return sent.filter(Boolean).length;
}

/**
 * Notifies every active student who can currently see a task that inherits access from its
 * lesson/course (explicitly assigned tasks are announced through their TASK rule instead).
 */
export async function notifyTaskAudience(task) {
  if (!task.isPublished || (!task.lessonId && !task.courseId)) return 0;
  let chain;
  if (task.lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: task.lessonId },
      select: { id: true, moduleId: true, module: { select: { courseId: true, course: { select: { levelId: true } } } } },
    });
    if (!lesson) return 0;
    chain = [["LESSON", lesson.id], ["MODULE", lesson.moduleId], ["COURSE", lesson.module.courseId], ["LEVEL", lesson.module.course.levelId]];
  } else {
    const course = await prisma.course.findUnique({ where: { id: task.courseId }, select: { levelId: true } });
    if (!course) return 0;
    chain = [["COURSE", task.courseId], ["LEVEL", course.levelId]];
  }
  const students = await prisma.user.findMany({ where: { role: "STUDENT", isActive: true }, select: { id: true } });
  const sent = await mapChunked(students, async (s) => {
    const rules = await loadRules(s.id);
    if (rules.map.has(ruleKey("TASK", task.id)) || !resolve(rules, chain).open) return false;
    await notify(s.id, { type: "TASK_ASSIGNED", title: `مهمة جديدة: ${task.title}`, link: `/tasks/${task.id}` });
    return true;
  });
  return sent.filter(Boolean).length;
}
