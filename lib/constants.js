// Enum-like values shared by the server (validation) and the UI (labels).

export const ROLES = { ADMIN: "ADMIN", STUDENT: "STUDENT" };

export const RESOURCE_TYPES = ["LEVEL", "COURSE", "MODULE", "LESSON", "TASK"];
export const EFFECTS = ["ALLOW", "DENY"];

export const COURSE_DIFFICULTIES = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدّم",
};

export const TASK_TYPES = {
  TASK: "مهمة",
  HOMEWORK: "واجب",
  CHALLENGE: "تحدٍّ",
  PROJECT: "مشروع",
};

export const TASK_DIFFICULTIES = {
  EASY: "سهل",
  MEDIUM: "متوسط",
  HARD: "صعب",
  EXPERT: "خبير",
};

export const DIFFICULTY_TONES = {
  EASY: "mint",
  MEDIUM: "sky",
  HARD: "amber",
  EXPERT: "coral",
  BEGINNER: "mint",
  INTERMEDIATE: "sky",
  ADVANCED: "coral",
};

export const SUBMISSION_STATUSES = {
  SUBMITTED: "بانتظار المراجعة",
  NEEDS_REVISION: "يحتاج تعديل",
  APPROVED: "مقبول",
};

export const SUBMISSION_TONES = {
  SUBMITTED: "sky",
  NEEDS_REVISION: "amber",
  APPROVED: "mint",
};

export const ACHIEVEMENT_CRITERIA = {
  LESSONS_COMPLETED: "عدد الدروس المكتملة",
  TASKS_APPROVED: "عدد المهام المقبولة",
  XP_EARNED: "مجموع نقاط الخبرة",
  STREAK_DAYS: "أيام متتالية",
  COURSES_COMPLETED: "عدد الدورات المكتملة",
  QUIZ_PERFECT: "اختبارات بعلامة كاملة",
  MANUAL: "يمنحها المعلّم يدويًا",
};

export const NOTIFICATION_TYPES = [
  "LESSON_UNLOCKED",
  "TASK_ASSIGNED",
  "FEEDBACK",
  "ACHIEVEMENT",
  "SYSTEM",
];

export const BLOCK_TYPES = {
  text: "نص",
  video: "فيديو",
  image: "صورة",
  code: "كود",
  attachment: "مرفق",
  callout: "ملاحظة",
};

export const CODE_LANGUAGES = [
  "python",
  "javascript",
  "html",
  "css",
  "cpp",
  "java",
  "sql",
  "bash",
  "json",
  "plaintext",
];

// Rank ladder — follows the brand story: from a spark to a galaxy.
export const RANKS = [
  { min: 0, title: "شرارة", en: "Spark", color: "#FFB547" },
  { min: 100, title: "وهج", en: "Glow", color: "#FF9F43" },
  { min: 300, title: "شعلة", en: "Flame", color: "#FF6B81" },
  { min: 700, title: "نجم", en: "Star", color: "#7C5CFF" },
  { min: 1500, title: "مذنّب", en: "Comet", color: "#38BDF8" },
  { min: 3000, title: "مجرّة", en: "Galaxy", color: "#22C5A0" },
];

export const AI_MODEL_PRESETS = [
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash", note: "موصى به" },
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", note: "الأحدث" },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", note: "الأسرع والأوفر" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", note: "غير متاح للحسابات الجديدة" },
];

// Reactions students can leave on announcements.
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "🎉", "🔥", "🤩", "🙏"];

export const PALETTE = [
  "#7C5CFF",
  "#FFB547",
  "#22C5A0",
  "#FF6B81",
  "#38BDF8",
  "#A78BFA",
  "#F472B6",
  "#FB923C",
];

// Avatar picker — kept separate boy/girl sets so students can pick one that matches them.
export const AVATARS = {
  boy: ["👦", "🧒", "🤴", "🥷", "🦸", "🧙", "🧛", "🤖"],
  girl: ["👧", "👩", "👸", "🧚", "🧞", "🦹", "🧜", "🐱"],
};

export const AVATAR_VALUES = [...AVATARS.boy, ...AVATARS.girl];
