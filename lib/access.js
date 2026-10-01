import "server-only";
import { prisma } from "./db";
import { notify } from "./notify";
import { STATES, resolveChain, ruleKey } from "./access-rules";

/*
 * Permission engine.
 *
 * Students only see what the teacher assigned. For any piece of content we walk from the most
 * specific rule to the least specific one and the first rule found decides:
 *
 *   LESSON → MODULE → COURSE → LEVEL → (nothing) = locked "unassigned"
 *
 * A rule is ALLOW or DENY, optionally bounded by availableFrom / availableUntil.
 * Course.sequential then adds "finish the previous lesson first" gating on top.
 */

export { STATES };

export async function loadRules(userId) {
  const rules = await prisma.accessRule.findMany({ where: { userId } });
  return { map: new Map(rules.map((r) => [ruleKey(r.resourceType, r.resourceId), r])), now: new Date() };
}

export function resolve(rules, chain) {
  return resolveChain(rules.map, chain, rules.now);
}

const curriculumInclude = {
  courses: {
    where: { isPublished: true },
    orderBy: { order: "asc" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            select: { id: true, title: true, summary: true, order: true, xpReward: true, durationMin: true },
          },
        },
      },
    },
  },
};

/**
 * Builds the full roadmap as this student sees it: every level, course, module and lesson with
 * its access state and completion. The curriculum is small (hundreds of lessons at most), so
 * computing it in one pass per request is simpler and safer than caching.
 */
export async function buildStudentTree(userId) {
  const [levels, rules, progress] = await Promise.all([
    prisma.level.findMany({ orderBy: { order: "asc" }, include: curriculumInclude }),
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
export async function getStudentTasks(userId, tree) {
  tree ??= await buildStudentTree(userId);
  const tasks = await prisma.task.findMany({
    where: { isPublished: true },
    orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    include: {
      course: { select: { id: true, title: true, levelId: true, color: true, isPublished: true } },
      lesson: { select: { id: true, title: true } },
      submissions: { where: { studentId: userId } },
    },
  });

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

/**
 * Lazily announces rules that became active (immediately-active rules and scheduled rules whose
 * date arrived). Called when the student loads the app, so no cron job is needed.
 */
export async function announceUnlocks(userId) {
  const now = new Date();
  const pending = await prisma.accessRule.findMany({
    where: {
      userId,
      effect: "ALLOW",
      notifiedAt: null,
      OR: [{ availableFrom: null }, { availableFrom: { lte: now } }],
    },
  });
  for (const rule of pending) {
    if (rule.availableUntil && rule.availableUntil < now) continue;
    const title = await resourceTitle(rule.resourceType, rule.resourceId);
    const copy = UNLOCK_COPY[rule.resourceType];
    if (title && copy) {
      await notify(userId, {
        type: rule.resourceType === "TASK" ? "TASK_ASSIGNED" : "LESSON_UNLOCKED",
        title: `${copy.verb}: ${title}`,
        link: copy.link(rule.resourceId),
      });
    }
    await prisma.accessRule.update({ where: { id: rule.id }, data: { notifiedAt: now } });
  }
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
  let count = 0;
  for (const s of students) {
    const rules = await loadRules(s.id);
    if (resolve(rules, chain).open) {
      await notify(s.id, { type: "LESSON_UPDATED", title: `تحديث على الدرس: ${lesson.title}`, link: `/lessons/${lesson.id}` });
      count++;
    }
  }
  return count;
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
  let count = 0;
  for (const s of students) {
    const rules = await loadRules(s.id);
    if (rules.map.has(ruleKey("TASK", task.id))) continue;
    if (resolve(rules, chain).open) {
      await notify(s.id, { type: "TASK_ASSIGNED", title: `مهمة جديدة: ${task.title}`, link: `/tasks/${task.id}` });
      count++;
    }
  }
  return count;
}
