// Seeds Wameed with a full starter curriculum, tasks, achievements, a teacher and demo students.
// ⚠️ Destructive: wipes existing data first. Run with: npm run db:seed

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { levels, tasks, achievements } = require("./curriculum");

const prisma = new PrismaClient();
const DAY = 86400000;
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

async function wipe() {
  // Children first.
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.accessRule.deleteMany();
  await prisma.task.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.level.deleteMany();
  await prisma.upload.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.aISettings.deleteMany();
}

async function seedCurriculum() {
  const index = { courses: {}, lessons: {}, levels: [] };
  for (const [li, level] of levels.entries()) {
    const { courses, ...levelData } = level;
    const lv = await prisma.level.create({ data: { ...levelData, order: li } });
    index.levels.push(lv);
    for (const [ci, course] of courses.entries()) {
      const { modules, ...courseData } = course;
      const c = await prisma.course.create({ data: { ...courseData, levelId: lv.id, order: ci, sequential: true, isPublished: true } });
      index.courses[c.title] = { ...c, lessons: [] };
      for (const [mi, mod] of modules.entries()) {
        const m = await prisma.module.create({ data: { title: mod.title, courseId: c.id, order: mi } });
        for (const [lIdx, lesson] of mod.lessons.entries()) {
          const l = await prisma.lesson.create({
            data: {
              moduleId: m.id,
              order: lIdx,
              title: lesson.title,
              summary: lesson.summary,
              durationMin: lesson.durationMin ?? 10,
              xpReward: 10 + (lesson.quiz?.length ?? 0) * 2,
              blocks: JSON.stringify(lesson.blocks),
              isPublished: true,
              quiz: {
                create: (lesson.quiz ?? []).map((q, i) => ({
                  order: i,
                  question: q.question,
                  options: JSON.stringify(q.options),
                  correctIndex: q.correctIndex,
                  explanation: q.explanation,
                })),
              },
            },
          });
          index.lessons[l.title] = { ...l, moduleId: m.id, courseId: c.id };
          index.courses[c.title].lessons.push(l);
        }
      }
    }
  }
  return index;
}

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Wameed@2026";
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || "spark123";

  console.log("🧹 Wiping database…");
  await wipe();

  console.log("📚 Seeding curriculum…");
  const idx = await seedCurriculum();

  console.log("🏅 Achievements, tasks, AI settings…");
  const achRows = {};
  for (const a of achievements) achRows[a.key] = await prisma.achievement.create({ data: a });

  const taskRows = {};
  for (const t of tasks) {
    const course = t.ref?.course ? idx.courses[t.ref.course] : null;
    const lesson = t.ref?.lesson ? idx.lessons[t.ref.lesson] : null;
    taskRows[t.title] = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        type: t.type,
        difficulty: t.difficulty,
        points: t.points,
        skills: JSON.stringify(t.skills),
        deadline: t.days ? new Date(Date.now() + t.days * DAY) : null,
        courseId: course?.id ?? null,
        lessonId: lesson?.id ?? null,
        isPublished: true,
      },
    });
  }

  await prisma.aISettings.create({ data: { id: 1, enabled: true, model: "gemini-3.6-flash", dailyLimit: 30, maxOutputTokens: 1024, temperature: 0.6 } });

  console.log("👩‍🏫 Users…");
  const admin = await prisma.user.create({
    data: {
      name: "المعلّم",
      username: "admin",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      avatarColor: "#7C5CFF",
      teacher: { create: { title: "مدير الأكاديمية", bio: "مؤسس أكاديمية وَمِيض" } },
    },
  });

  const studentHash = await bcrypt.hash(studentPassword, 10);
  const today = new Date();
  const mkStudent = (data, profile) =>
    prisma.user.create({
      data: { ...data, passwordHash: studentHash, role: "STUDENT", student: { create: profile } },
    });

  const [L1, L2] = idx.levels;
  const world = idx.courses["عالم البرمجة"];
  const problem = idx.courses["حل المشكلات"];
  const python = idx.courses["Python من الصفر"];

  // Sara (13): whole Level 1 + the Python course, good progress.
  const sara = await mkStudent(
    { name: "سارة أحمد", username: "sara", avatarColor: "#F472B6" },
    { birthYear: today.getFullYear() - 13, xp: 0, streakDays: 4, bestStreak: 6, lastActiveDate: dayKey(today) }
  );
  await prisma.accessRule.createMany({
    data: [
      { userId: sara.id, resourceType: "LEVEL", resourceId: L1.id, effect: "ALLOW", notifiedAt: today },
      { userId: sara.id, resourceType: "COURSE", resourceId: python.id, effect: "ALLOW" },
    ],
  });

  // Omar (16): Levels 1 & 2.
  const omar = await mkStudent(
    { name: "عمر خالد", username: "omar", avatarColor: "#38BDF8" },
    { birthYear: today.getFullYear() - 16, streakDays: 1, bestStreak: 3, lastActiveDate: dayKey(new Date(Date.now() - DAY)) }
  );
  await prisma.accessRule.createMany({
    data: [
      { userId: omar.id, resourceType: "LEVEL", resourceId: L1.id, effect: "ALLOW", notifiedAt: today },
      { userId: omar.id, resourceType: "LEVEL", resourceId: L2.id, effect: "ALLOW", notifiedAt: today },
    ],
  });

  // Lina (11): shows fine-grained control — one course, one lesson denied, one course scheduled.
  const lina = await mkStudent(
    { name: "لينا يوسف", username: "lina", avatarColor: "#FFB547" },
    { birthYear: today.getFullYear() - 11, aiEnabled: true }
  );
  await prisma.accessRule.createMany({
    data: [
      { userId: lina.id, resourceType: "COURSE", resourceId: world.id, effect: "ALLOW" },
      { userId: lina.id, resourceType: "LESSON", resourceId: world.lessons[3].id, effect: "DENY" },
      { userId: lina.id, resourceType: "COURSE", resourceId: problem.id, effect: "ALLOW", availableFrom: new Date(Date.now() + 3 * DAY) },
      { userId: lina.id, resourceType: "TASK", resourceId: taskRows["تحدي الأسبوع: اكتشف النمط 🧩"].id, effect: "ALLOW" },
    ],
  });

  console.log("📈 Demo progress…");
  const complete = async (user, lessons, daysAgo = 1) => {
    let xp = 0;
    for (const [i, l] of lessons.entries()) {
      const quizTotal = await prisma.quizQuestion.count({ where: { lessonId: l.id } });
      await prisma.lessonProgress.create({
        data: {
          userId: user.id,
          lessonId: l.id,
          completedAt: new Date(Date.now() - (daysAgo + lessons.length - i) * DAY / 2),
          quizScore: quizTotal || null,
          quizTotal: quizTotal || null,
          xpEarned: l.xpReward + (quizTotal ? 5 : 0),
        },
      });
      xp += l.xpReward + (quizTotal ? 5 : 0);
    }
    return xp;
  };

  const saraXp = (await complete(sara, world.lessons)) + (await complete(sara, python.lessons.slice(0, 2)));
  const omarXp = await complete(omar, [...world.lessons, ...problem.lessons, ...python.lessons.slice(0, 4)]);

  // Sara's approved homework + Omar's pending challenge.
  const homework = taskRows["اكتب خوارزمية تحضير كوب شاي ☕"];
  await prisma.submission.create({
    data: {
      taskId: homework.id,
      studentId: sara.id,
      content: "1. املأ الغلاية بالماء\n2. شغّل الغلاية وانتظر حتى يغلي الماء\n3. ضع كيس شاي في الكوب\n4. اسكب الماء المغلي في الكوب\n5. انتظر 3 دقائق ثم أخرج الكيس\n6. أضف ملعقة سكر وحرّك",
      status: "APPROVED",
      grade: 95,
      feedback: "ممتاز يا سارة! 🌟 خطواتك واضحة ومرتّبة. لاحظي كيف حددتِ **3 دقائق** بدل «قليلًا» — هذا بالضبط تفكير المبرمج.",
      pointsAwarded: 19,
      reviewerId: admin.id,
      reviewedAt: new Date(Date.now() - DAY),
      submittedAt: new Date(Date.now() - 2 * DAY),
    },
  });
  await prisma.submission.create({
    data: {
      taskId: taskRows["تحدي FizzBuzz 🔥"].id,
      studentId: omar.id,
      code: 'for i in range(1, 101):\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)',
      content: "استخدمت % 15 أولًا لأن الرقم الذي يقبل القسمة على 3 و 5 معًا يقبل القسمة على 15.",
      status: "SUBMITTED",
      submittedAt: new Date(Date.now() - 3 * 3600000),
    },
  });

  await prisma.studentProfile.update({ where: { userId: sara.id }, data: { xp: saraXp + 19 + 10 + 10 + 15 } });
  await prisma.studentProfile.update({ where: { userId: omar.id }, data: { xp: omarXp + 10 + 10 + 30 } });

  const grant = (user, key, daysAgo) =>
    prisma.userAchievement.create({ data: { userId: user.id, achievementId: achRows[key].id, earnedAt: new Date(Date.now() - daysAgo * DAY) } });
  await grant(sara, "first_lesson", 5);
  await grant(sara, "quiz_perfect", 5);
  await grant(sara, "first_task", 1);
  await grant(sara, "streak_3", 2);
  await grant(omar, "first_lesson", 6);
  await grant(omar, "quiz_perfect", 6);
  await grant(omar, "lessons_10", 1);

  await prisma.notification.createMany({
    data: [
      { userId: sara.id, type: "FEEDBACK", title: "تم قبول حلّك: اكتب خوارزمية تحضير كوب شاي ☕ 🎉", body: "حصلت على 19 XP", link: `/tasks/${homework.id}`, readAt: new Date() },
      { userId: sara.id, type: "SYSTEM", title: "أهلًا بك في وَمِيض ✨", body: "رحلتك في عالم البرمجة بدأت. أكمل أول درس لتحصل على أول وسام!", link: "/roadmap" },
      { userId: omar.id, type: "SYSTEM", title: "أهلًا بك في وَمِيض ✨", body: "مستوياتك مفتوحة. انطلق!", link: "/roadmap" },
    ],
  });

  const lessonCount = await prisma.lesson.count();
  console.log(`\n✅ Done: ${idx.levels.length} levels, ${Object.keys(idx.courses).length} courses, ${lessonCount} lessons, ${tasks.length} tasks, ${achievements.length} achievements.`);
  console.log("\n🔑 Logins");
  console.log(`   Teacher : admin / ${adminPassword}`);
  console.log(`   Students: sara, omar, lina / ${studentPassword}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
