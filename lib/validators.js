import { z } from "zod";
import {
  ACHIEVEMENT_CRITERIA,
  AVATAR_VALUES,
  COURSE_DIFFICULTIES,
  EFFECTS,
  RESOURCE_TYPES,
  SUBMISSION_STATUSES,
  TASK_DIFFICULTIES,
  TASK_TYPES,
} from "./constants";

const keys = (obj) => Object.keys(obj);

const text = (max, label = "الحقل") =>
  z.string().trim().max(max, `${label} طويل جدًا`);
const required = (max, label) => text(max, label).min(1, `${label} مطلوب`);
const optionalText = (max, label) =>
  text(max, label).optional().nullable().transform((v) => (v === undefined ? undefined : v || null));

// Only http(s) links or files served by our own authenticated file route.
export const safeUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => /^https?:\/\//i.test(v) || /^\/api\/files\/[\w-]+$/.test(v), "رابط غير صالح");

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح");
const icon = z.string().regex(/^[A-Za-z0-9]{2,40}$/, "أيقونة غير صالحة");
const avatar = z.enum(AVATAR_VALUES).nullable();

const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined) return undefined;
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: "custom", message: "تاريخ غير صالح" });
      return z.NEVER;
    }
    return d;
  });

const fileRef = z.object({
  url: safeUrl,
  name: required(200, "اسم الملف"),
  size: z.number().int().nonnegative().optional(),
});

// ─── Auth & profile ─────────────────────────────────────────────

export const loginSchema = z.object({
  username: required(60, "اسم المستخدم").toLowerCase(),
  password: z.string().min(1, "كلمة المرور مطلوبة").max(200),
});

export const passwordSchema = z
  .string()
  .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
  .max(100);

export const profileSchema = z.object({
  name: required(80, "الاسم").optional(),
  avatarColor: color.optional(),
  avatar: avatar.optional(),
  currentPassword: z.string().max(100).optional(),
  newPassword: passwordSchema.optional(),
});

// ─── Students ───────────────────────────────────────────────────

const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_.-]{3,30}$/, "اسم المستخدم: 3-30 حرفًا إنجليزيًا أو أرقامًا أو _ . -");

const studentFields = {
  name: required(80, "الاسم"),
  username,
  email: z
    .union([z.email("بريد إلكتروني غير صالح"), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null)),
  birthYear: z
    .preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().int().min(1950, "سنة غير صالحة").max(2030, "سنة غير صالحة").nullable())
    .optional(),
  guardianContact: optionalText(120, "وسيلة التواصل"),
  notes: optionalText(2000, "الملاحظات"),
  aiEnabled: z.boolean().optional(),
  avatarColor: color.optional(),
  avatar: avatar.optional(),
};

export const studentCreateSchema = z.object({
  ...studentFields,
  password: passwordSchema,
  levelIds: z.array(z.string()).max(50).optional().default([]),
});

export const studentUpdateSchema = z.object({
  ...studentFields,
  name: studentFields.name.optional(),
  username: username.optional(),
  password: z.union([passwordSchema, z.literal("")]).optional(),
  isActive: z.boolean().optional(),
});

// ─── Access control ─────────────────────────────────────────────

const ruleSchema = z
  .object({
    resourceType: z.enum(RESOURCE_TYPES),
    resourceId: z.string().min(1).max(60),
    effect: z.enum(EFFECTS),
    availableFrom: optionalDate,
    availableUntil: optionalDate,
  })
  .refine((r) => !r.availableFrom || !r.availableUntil || r.availableFrom < r.availableUntil, {
    message: "تاريخ الإغلاق يجب أن يكون بعد تاريخ الفتح",
  });

export const accessRulesSchema = z.object({
  rules: z.array(ruleSchema).max(2000),
});

export const bulkAccessSchema = z.object({
  userIds: z.array(z.string()).min(1, "اختر طالبًا واحدًا على الأقل").max(500),
  resources: z
    .array(z.object({ type: z.enum(RESOURCE_TYPES), id: z.string().min(1) }))
    .min(1, "اختر محتوى واحدًا على الأقل")
    .max(500),
  mode: z.enum(["ALLOW", "DENY", "REMOVE"]),
  availableFrom: optionalDate,
  availableUntil: optionalDate,
});

// ─── Curriculum ─────────────────────────────────────────────────

export const levelSchema = z.object({
  title: required(120, "العنوان"),
  subtitle: optionalText(160, "العنوان الفرعي"),
  description: optionalText(2000, "الوصف"),
  color: color.optional(),
  icon: icon.optional(),
  order: z.number().int().optional(),
});

export const courseSchema = z.object({
  levelId: z.string().min(1, "المستوى مطلوب"),
  title: required(120, "العنوان"),
  description: optionalText(4000, "الوصف"),
  icon: icon.optional(),
  color: color.optional(),
  difficulty: z.enum(keys(COURSE_DIFFICULTIES)).optional(),
  sequential: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const moduleSchema = z.object({
  courseId: z.string().min(1),
  title: required(120, "عنوان الوحدة"),
  order: z.number().int().optional(),
});

const blockId = z.string().min(1).max(40);
export const blockSchema = z.discriminatedUnion("type", [
  z.object({ id: blockId, type: z.literal("text"), markdown: text(50000, "النص") }),
  z.object({ id: blockId, type: z.literal("video"), url: safeUrl, caption: optionalText(300, "الوصف") }),
  z.object({ id: blockId, type: z.literal("image"), url: safeUrl, caption: optionalText(300, "الوصف") }),
  z.object({
    id: blockId,
    type: z.literal("code"),
    language: z.string().regex(/^[a-z0-9+#-]{1,20}$/),
    title: optionalText(120, "العنوان"),
    code: text(20000, "الكود"),
  }),
  z.object({ id: blockId, type: z.literal("attachment"), url: safeUrl, name: required(200, "اسم الملف"), size: z.number().optional() }),
  z.object({
    id: blockId,
    type: z.literal("callout"),
    variant: z.enum(["tip", "info", "warning"]),
    markdown: text(5000, "النص"),
  }),
]);

export const quizQuestionSchema = z
  .object({
    question: required(500, "السؤال"),
    options: z.array(required(300, "الخيار")).min(2, "خياران على الأقل").max(6),
    correctIndex: z.number().int().min(0),
    explanation: optionalText(1000, "الشرح"),
  })
  .refine((q) => q.correctIndex < q.options.length, { message: "الإجابة الصحيحة غير موجودة في الخيارات" });

export const lessonCreateSchema = z.object({
  moduleId: z.string().min(1),
  title: required(160, "عنوان الدرس"),
});

export const lessonUpdateSchema = z.object({
  title: required(160, "عنوان الدرس").optional(),
  summary: optionalText(500, "الملخص"),
  moduleId: z.string().min(1).optional(),
  blocks: z.array(blockSchema).max(200).optional(),
  quiz: z.array(quizQuestionSchema).max(50).optional(),
  xpReward: z.number().int().min(0).max(1000).optional(),
  durationMin: z.number().int().min(1).max(600).optional(),
  isPublished: z.boolean().optional(),
  notifyStudents: z.boolean().optional(),
});

export const reorderSchema = z.object({
  kind: z.enum(["level", "course", "module", "lesson"]),
  ids: z.array(z.string()).min(1).max(500),
});

// ─── Tasks ──────────────────────────────────────────────────────

export const taskSchema = z.object({
  title: required(160, "العنوان"),
  description: required(20000, "الوصف"),
  type: z.enum(keys(TASK_TYPES)).optional(),
  difficulty: z.enum(keys(TASK_DIFFICULTIES)).optional(),
  skills: z.array(required(40, "المهارة")).max(20).optional(),
  attachments: z.array(fileRef).max(20).optional(),
  deadline: optionalDate,
  points: z.number().int().min(0).max(5000).optional(),
  courseId: z.string().optional().nullable().transform((v) => (v === undefined ? undefined : v || null)),
  lessonId: z.string().optional().nullable().transform((v) => (v === undefined ? undefined : v || null)),
  isPublished: z.boolean().optional(),
});

export const taskAssignSchema = z.object({
  userIds: z.array(z.string()).max(500),
});

export const submissionSchema = z
  .object({
    content: optionalText(20000, "الشرح"),
    code: optionalText(50000, "الكود"),
    links: z.array(z.url({ protocol: /^https?$/, error: "رابط غير صالح" })).max(10).optional().default([]),
    files: z.array(fileRef).max(10).optional().default([]),
  })
  .refine((s) => s.content || s.code || s.links.length || s.files.length, {
    message: "أضف شرحًا أو كودًا أو رابطًا أو ملفًا قبل التسليم",
  });

export const reviewSchema = z.object({
  status: z.enum(keys(SUBMISSION_STATUSES).filter((s) => s !== "SUBMITTED")),
  grade: z.number().int().min(0).max(100).optional().nullable(),
  feedback: optionalText(10000, "الملاحظات"),
});

// ─── Achievements & notifications ───────────────────────────────

export const achievementSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9_-]{2,40}$/, "المعرّف: أحرف إنجليزية صغيرة وأرقام و _ -"),
  title: required(80, "العنوان"),
  description: required(300, "الوصف"),
  icon: icon.optional(),
  color: color.optional(),
  criteria: z.enum(keys(ACHIEVEMENT_CRITERIA)),
  threshold: z.number().int().min(1).max(100000).optional(),
  xpBonus: z.number().int().min(0).max(5000).optional(),
});

export const grantSchema = z.object({
  userId: z.string().min(1),
  achievementId: z.string().min(1),
});

export const broadcastSchema = z.object({
  target: z.enum(["all", "selected"]),
  userIds: z.array(z.string()).max(1000).optional().default([]),
  title: required(160, "العنوان"),
  body: optionalText(2000, "النص"),
  link: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/[\w\-/]*$/, "الرابط يجب أن يكون مسارًا داخليًا مثل /tasks")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => v || null),
});

// ─── AI ─────────────────────────────────────────────────────────

export const aiSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  model: z.string().trim().regex(/^[a-z0-9.\-]{3,60}$/i, "اسم نموذج غير صالح").optional(),
  apiKey: z.string().trim().max(200).optional().nullable(),
  systemPrompt: optionalText(8000, "التعليمات"),
  dailyLimit: z.coerce.number().int().min(0).max(1000).optional(),
  maxOutputTokens: z.coerce.number().int().min(128).max(8192).optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  allowCodeReview: z.boolean().optional(),
  allowFullSolutions: z.boolean().optional(),
});

export const aiChatSchema = z.object({
  conversationId: z.string().optional().nullable(),
  message: required(8000, "الرسالة"),
  mode: z.enum(["chat", "explain", "review", "hint", "debug"]).default("chat"),
  context: z
    .object({ lessonId: z.string().optional(), taskId: z.string().optional() })
    .optional()
    .nullable(),
});
