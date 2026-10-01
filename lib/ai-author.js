import "server-only";
import { ApiError } from "./api";
import { answerText, createClient, generationConfig, getAISettings } from "./ai";
import { blockSchema, quizQuestionSchema } from "./validators";
import { CODE_LANGUAGES, TASK_DIFFICULTIES, TASK_TYPES } from "./constants";

// AI authoring for the teacher: lessons, quizzes, tasks and course outlines.
// Gemini returns JSON that matches a schema; everything is re-validated with the app's own
// zod schemas before it reaches the editor, and nothing is saved until the teacher saves.

const AUTHOR_SYSTEM = `أنت مصمّم مناهج خبير ومعلّم برمجة في أكاديمية "وَمِيض" العربية.
الطلاب أعمارهم من 10 إلى 25 سنة. اكتب بعربية فصحى بسيطة وودودة ومشوّقة، واترك المصطلحات التقنية والكود بالإنجليزية.
قواعد:
- الشرح بخطوات قصيرة مع تشبيهات من الحياة اليومية، ثم أمثلة كود صغيرة ومعلّقة.
- الكود صحيح وقابل للتشغيل، بأسماء متغيرات إنجليزية واضحة، والتعليقات داخله بالعربية.
- Markdown فقط (عناوين ##، قوائم، **غامق**، \`كود\`)، بدون HTML.
- لا تذكر أنك ذكاء اصطناعي، ولا تضف مقدمات عن نفسك.`;

const AUDIENCES = {
  kids: "أطفال من 10 إلى 13 سنة: جمل قصيرة جدًا، تشبيهات من الألعاب والحياة، أمثلة ممتعة.",
  teens: "مراهقون من 14 إلى 17 سنة: شرح واضح مع أمثلة عملية من اهتماماتهم (ألعاب، تطبيقات، مواقع).",
  adults: "شباب من 18 إلى 25 سنة: شرح أعمق واحترافي مع أمثلة من سوق العمل.",
};

const DEPTHS = {
  short: { label: "درس قصير (5-8 دقائق)", blocks: "4 إلى 6 كتل", tokens: 5000 },
  standard: { label: "درس متوسط (10-15 دقيقة)", blocks: "6 إلى 9 كتل", tokens: 8000 },
  deep: { label: "درس معمّق (20-30 دقيقة)", blocks: "9 إلى 13 كتلة", tokens: 12000 },
};

async function callModel({ prompt, schema, maxOutputTokens, temperature }) {
  const settings = await getAISettings();
  const client = createClient(settings);
  if (!client) throw new ApiError(503, "أضف مفتاح Gemini من صفحة المساعد الذكي أولًا");
  let res;
  // Gemini occasionally answers 503/429 under load — retry a couple of times with backoff.
  for (let attempt = 0; ; attempt++) {
    try {
      res = await client.models.generateContent({
        model: settings.model,
        contents: prompt,
        config: {
          ...generationConfig({ ...settings, maxOutputTokens, temperature }, AUTHOR_SYSTEM),
          ...(schema ? { responseMimeType: "application/json", responseJsonSchema: schema } : {}),
        },
      });
      break;
    } catch (err) {
      const msg = String(err?.message ?? err);
      const quota = /quota|billing/i.test(msg);
      const busy = !quota && /\b(503|429)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(msg);
      if (busy && attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      console.error("[ai-author]", msg.slice(0, 500));
      throw new ApiError(
        quota ? 429 : 502,
        quota
          ? "انتهت الحصة المتاحة لمفتاح Gemini (Quota). انتظر حتى تتجدد أو فعّل الفوترة في Google AI Studio."
          : busy
            ? "نموذج Gemini مشغول حاليًا بسبب ضغط كبير. حاول بعد دقيقة."
            : "تعذّر الاتصال بـ Gemini. تحقّق من المفتاح والنموذج في صفحة المساعد الذكي."
      );
    }
  }
  if (res.candidates?.[0]?.finishReason === "MAX_TOKENS") {
    throw new ApiError(502, "المحتوى أطول من المسموح. اختر عمقًا أقصر أو عددًا أقل ثم حاول مجددًا.");
  }
  return answerText(res);
}

async function generateJSON({ prompt, schema, maxOutputTokens = 8000, temperature = 0.7 }) {
  const text = await callModel({ prompt, schema, maxOutputTokens, temperature });
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(502, "وصلت إجابة غير مكتملة من الذكاء الاصطناعي، حاول مرة أخرى.");
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);

function cleanBlocks(raw = []) {
  const out = [];
  for (const b of raw) {
    const block = { id: uid(), type: b.type };
    if (b.type === "text") block.markdown = b.markdown ?? "";
    else if (b.type === "callout") Object.assign(block, { variant: ["tip", "info", "warning"].includes(b.variant) ? b.variant : "tip", markdown: b.markdown ?? "" });
    else if (b.type === "code")
      Object.assign(block, { language: CODE_LANGUAGES.includes(b.language) ? b.language : "plaintext", title: b.title || null, code: b.code ?? "" });
    else continue;
    const parsed = blockSchema.safeParse(block);
    if (parsed.success && (block.markdown || block.code)) out.push(parsed.data);
  }
  return out;
}

function cleanQuiz(raw = []) {
  return raw
    .map((q) => ({
      question: q.question,
      options: (q.options ?? []).slice(0, 6),
      correctIndex: q.correctIndex,
      explanation: q.explanation ?? "",
    }))
    .filter((q) => quizQuestionSchema.safeParse(q).success);
}

// ─── Schemas (JSON Schema for Gemini structured output) ────────────

const QUIZ_ITEM = {
  type: "object",
  properties: {
    question: { type: "string" },
    options: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 4 },
    correctIndex: { type: "integer", minimum: 0, maximum: 3 },
    explanation: { type: "string" },
  },
  required: ["question", "options", "correctIndex", "explanation"],
};

const LESSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    durationMin: { type: "integer", minimum: 3, maximum: 60 },
    blocks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["text", "code", "callout"] },
          markdown: { type: "string", description: "For text and callout blocks" },
          variant: { type: "string", enum: ["tip", "info", "warning"], description: "For callout blocks" },
          language: { type: "string", enum: CODE_LANGUAGES, description: "For code blocks" },
          title: { type: "string", description: "File name for code blocks, e.g. main.py" },
          code: { type: "string", description: "For code blocks" },
        },
        required: ["type"],
      },
    },
    quiz: { type: "array", items: QUIZ_ITEM },
  },
  required: ["title", "summary", "durationMin", "blocks", "quiz"],
};

// ─── Generators ─────────────────────────────────────────────────

export async function generateLesson({ topic, audience, depth, language, quizCount, notes, context }) {
  const d = DEPTHS[depth] ?? DEPTHS.standard;
  const prompt = `اكتب درسًا كاملًا بعنوان/موضوع: "${topic}".
${context ? `السياق: ${context}\n` : ""}الجمهور: ${AUDIENCES[audience] ?? AUDIENCES.teens}
الطول: ${d.label}، بين ${d.blocks}.
لغة أمثلة الكود: ${language === "plaintext" ? "بدون كود إن لم يكن مناسبًا" : language}.
${notes ? `ملاحظات المعلّم: ${notes}\n` : ""}
هيكل الدرس المطلوب:
1. كتلة text تبدأ بسؤال أو موقف مشوّق يجذب الطالب، ثم الفكرة الأساسية بتشبيه.
2. كتل text لشرح المفهوم خطوة بخطوة (عناوين ##).
3. كتل code بأمثلة قصيرة متدرجة (كل مثال في كتلة مستقلة) يسبق كل واحدة شرح.
4. callout من نوع warning لخطأ شائع، و callout من نوع tip لنصيحة.
5. كتلة text أخيرة بعنوان "## جرّب بنفسك" فيها تمرين صغير، ثم ملخّص في نقاط.
الاختبار: ${quizCount > 0 ? `${quizCount} أسئلة اختيار من متعدد (3-4 خيارات) تقيس الفهم لا الحفظ، مع شرح قصير للإجابة. نوّع موضع الإجابة الصحيحة.` : "مصفوفة فارغة."}
summary: جملة واحدة تلخّص ما سيتعلمه الطالب.`;
  const raw = await generateJSON({ prompt, schema: LESSON_SCHEMA, maxOutputTokens: d.tokens });
  const blocks = cleanBlocks(raw.blocks);
  if (!blocks.length) throw new ApiError(502, "لم يُنتج الذكاء الاصطناعي محتوى صالحًا، حاول مرة أخرى.");
  return {
    title: String(raw.title ?? topic).slice(0, 160),
    summary: String(raw.summary ?? "").slice(0, 500),
    durationMin: Math.min(Math.max(Number(raw.durationMin) || 10, 3), 60),
    blocks,
    quiz: cleanQuiz(raw.quiz).slice(0, quizCount),
  };
}

export async function generateQuiz({ title, content, count, audience }) {
  const prompt = `اكتب ${count} أسئلة اختيار من متعدد (3-4 خيارات) لاختبار فهم درس "${title}".
الجمهور: ${AUDIENCES[audience] ?? AUDIENCES.teens}
الأسئلة تقيس الفهم والتطبيق (مثلًا: ماذا يطبع هذا الكود؟) وليس الحفظ. نوّع موضع الإجابة الصحيحة، وأضف شرحًا قصيرًا لكل إجابة.
محتوى الدرس:
"""
${content.slice(0, 14000)}
"""`;
  const raw = await generateJSON({
    prompt,
    schema: { type: "object", properties: { questions: { type: "array", items: QUIZ_ITEM } }, required: ["questions"] },
    maxOutputTokens: 4000,
    temperature: 0.6,
  });
  const questions = cleanQuiz(raw.questions).slice(0, count);
  if (!questions.length) throw new ApiError(502, "لم تُولَّد أسئلة صالحة، حاول مرة أخرى.");
  return { questions };
}

export async function generateTask({ topic, type, difficulty, audience, context, notes }) {
  const prompt = `صمّم ${TASK_TYPES[type] ?? "مهمة"} برمجية حول: "${topic}".
${context ? `السياق: ${context}\n` : ""}الصعوبة: ${TASK_DIFFICULTIES[difficulty] ?? "متوسط"}. الجمهور: ${AUDIENCES[audience] ?? AUDIENCES.teens}
${notes ? `ملاحظات المعلّم: ${notes}\n` : ""}
description بصيغة Markdown ويحتوي على الأقسام:
## الفكرة (قصة قصيرة ممتعة تشرح المطلوب)
## المطلوب (نقاط واضحة وقابلة للقياس)
## مثال على التشغيل (كتلة كود للمدخلات والمخرجات المتوقعة)
## إضافات للمتميزين ⭐ (اختيارية)
## معايير التقييم
لا تكتب الحل.
skills: من 2 إلى 5 مهارات قصيرة بالعربية أو أسماء تقنيات. points: رقم بين 10 و 150 يتناسب مع الصعوبة والحجم.`;
  const raw = await generateJSON({
    prompt,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        skills: { type: "array", items: { type: "string" }, maxItems: 6 },
        points: { type: "integer", minimum: 10, maximum: 200 },
      },
      required: ["title", "description", "skills", "points"],
    },
    maxOutputTokens: 5000,
  });
  return {
    title: String(raw.title ?? topic).slice(0, 160),
    description: String(raw.description ?? "").slice(0, 20000),
    skills: (raw.skills ?? []).map((s) => String(s).slice(0, 40)).filter(Boolean).slice(0, 6),
    points: Math.min(Math.max(Number(raw.points) || 30, 0), 5000),
  };
}

export async function generateOutline({ topic, audience, modules, lessonsPerModule, notes, context }) {
  const prompt = `صمّم خطة دورة تعليمية حول: "${topic}".
${context ? `السياق: ${context}\n` : ""}الجمهور: ${AUDIENCES[audience] ?? AUDIENCES.teens}
عدد الوحدات: ${modules}، وفي كل وحدة حوالي ${lessonsPerModule} دروس، متدرّجة من الأسهل للأصعب بحيث يبني كل درس على ما قبله.
${notes ? `ملاحظات المعلّم: ${notes}\n` : ""}
لكل درس: عنوان جذاب وقصير، و summary من جملة واحدة. description: وصف للدورة من جملتين.`;
  const raw = await generateJSON({
    prompt,
    schema: {
      type: "object",
      properties: {
        description: { type: "string" },
        modules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              lessons: {
                type: "array",
                items: { type: "object", properties: { title: { type: "string" }, summary: { type: "string" } }, required: ["title", "summary"] },
              },
            },
            required: ["title", "lessons"],
          },
        },
      },
      required: ["description", "modules"],
    },
    maxOutputTokens: 5000,
  });
  const outline = (raw.modules ?? [])
    .slice(0, 12)
    .map((m) => ({
      title: String(m.title ?? "").slice(0, 120),
      lessons: (m.lessons ?? []).slice(0, 15).map((l) => ({ title: String(l.title ?? "").slice(0, 160), summary: String(l.summary ?? "").slice(0, 500) })).filter((l) => l.title),
    }))
    .filter((m) => m.title && m.lessons.length);
  if (!outline.length) throw new ApiError(502, "لم تُولَّد خطة صالحة، حاول مرة أخرى.");
  return { description: String(raw.description ?? "").slice(0, 4000), modules: outline };
}

// ─── Writing assistant (inline "improve with AI") ─────────────────

export const TEXT_ACTIONS = {
  improve: "أعد صياغة النص ليصبح أوضح وأكثر تشويقًا وسلاسة، مع الحفاظ على المعنى والطول تقريبًا.",
  simplify: "بسّط النص ليفهمه طفل عمره 10-12 سنة: جمل قصيرة وكلمات سهلة وتشبيه من الحياة اليومية.",
  expand: "وسّع الشرح: أضف توضيحًا أعمق ومثالًا عمليًا قصيرًا (يمكن أن يكون كتلة كود ```)، دون تكرار.",
  shorten: "اختصر النص إلى النصف تقريبًا مع الإبقاء على الأفكار الأساسية.",
  fix: "صحّح الأخطاء الإملائية والنحوية وعلامات الترقيم فقط، دون تغيير الأسلوب أو المعنى.",
  analogy: "أضف تشبيهًا ممتعًا من الحياة اليومية يوضّح الفكرة، في موضع مناسب من النص.",
  continue: "أكمل كتابة النص بنفس الأسلوب بفقرة أو فقرتين تكملان الشرح منطقيًا. أعد النص الأصلي كما هو متبوعًا بالإكمال.",
};

export const CODE_ACTIONS = {
  fix: "صحّح أي أخطاء في الكود (منطقية أو في الصياغة) بأقل تغيير ممكن.",
  comment: "أضف تعليقات قصيرة بالعربية تشرح الأسطر المهمة لطالب مبتدئ، دون تغيير الكود نفسه.",
  improve: "حسّن الكود ليصبح أنظف وأوضح (أسماء أفضل، تبسيط) مع بقاء السلوك نفسه ومناسبًا للمبتدئين.",
  simplify: "بسّط الكود قدر الإمكان ليناسب مبتدئًا، مع نفس النتيجة.",
};

function stripFences(text) {
  const m = text.trim().match(/^```[\w+#-]*\n([\s\S]*?)\n?```$/);
  return m ? m[1] : text.trim();
}

export async function assistText({ text, action, instruction, kind, language, context }) {
  const isCode = kind === "code";
  const task = action === "custom" ? instruction : (isCode ? CODE_ACTIONS : TEXT_ACTIONS)[action];
  if (!task) throw new ApiError(400, "إجراء غير معروف");
  const empty = !text.trim();
  const prompt = isCode
    ? `${empty ? `اكتب كود ${language} حسب الطلب التالي: ${task}` : `المطلوب على كود ${language} التالي: ${task}`}
${context ? `سياق الدرس: ${context}\n` : ""}أعد الكود فقط، بدون أي شرح خارجه وبدون علامات \`\`\`.
${empty ? "" : `\nالكود:\n${text}`}`
    : `${empty ? `اكتب نصًا تعليميًا بصيغة Markdown حسب الطلب التالي: ${task}` : `المطلوب على النص التالي (Markdown): ${task}`}
${context ? `سياق الدرس: ${context}\n` : ""}أعد النص الناتج فقط بصيغة Markdown، بدون مقدمات أو تعليقات منك. حافظ على أي كود أو تنسيق Markdown موجود.
${empty ? "" : `\nالنص:\n"""\n${text}\n"""`}`;
  const out = await callModel({ prompt, maxOutputTokens: 4000, temperature: action === "fix" ? 0.2 : 0.6 });
  const result = isCode ? stripFences(out) : out.trim().replace(/^"""\n?|\n?"""$/g, "");
  if (!result) throw new ApiError(502, "لم تصل نتيجة، حاول مرة أخرى.");
  return { text: result };
}
