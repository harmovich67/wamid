"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  Circle,
  Code2,
  Compass,
  Flame,
  HelpCircle,
  Lightbulb,
  ListChecks,
  PartyPopper,
  Play,
  Route,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";

export function StarterQuest({
  lessonsDone = 0,
  submissionsTotal = 0,
  aiConversationsCount = 0,
  nextLesson = null,
}) {
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("learn");
  const [dismissed, setDismissed] = useState(false);

  const questSteps = [
    {
      id: "explore",
      title: "استكشف مسارك التعليمي",
      description: "تعرّف على مستويات وميض والدورات المتاحة لك",
      done: lessonsDone > 0,
      icon: Route,
      actionText: "افتح المسار",
      href: "/roadmap",
      tone: "primary",
    },
    {
      id: "lesson",
      title: "أكمل درسك الأول وحل الاختبار",
      description: "اقرأ الشرح وأجب عن أسئلة الفهم لكسب أول +10 XP",
      done: lessonsDone > 0,
      icon: BookOpen,
      actionText: nextLesson ? `تابع: ${nextLesson.title}` : "ابدأ أول درس",
      href: nextLesson ? `/lessons/${nextLesson.id}` : "/roadmap",
      tone: "amber",
    },
    {
      id: "task",
      title: "حل أول مهمة برمجية وسلّم الكود",
      description: "طبق ما تعلمته في محرر الكود ليراجعه معلّمك",
      done: submissionsTotal > 0,
      icon: Code2,
      actionText: "قائمة المهام",
      href: "/tasks",
      tone: "mint",
    },
    {
      id: "ai",
      title: "تحدث مع رفيقك الذكي «ومضة AI»",
      description: "اسأله سؤالاً برمجياً أو اطلب تلميحاً لمهمتك",
      done: aiConversationsCount > 0,
      icon: Bot,
      actionText: "ابدأ المحادثة",
      href: "/assistant",
      tone: "sky",
    },
  ];

  const completedCount = questSteps.filter((s) => s.done).length;
  const isAllComplete = completedCount === questSteps.length;

  if (dismissed && isAllComplete) return null;

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-surface/90 p-5 shadow-card backdrop-blur-xl sm:p-6">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -start-10 -top-10 size-44 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -end-10 size-44 rounded-full bg-amber/15 blur-3xl" />

        {/* Top Header */}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-lg shadow-primary/25">
              {isAllComplete ? <PartyPopper className="size-6 animate-bounce" /> : <Sparkles className="size-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-fg sm:text-lg">
                  {isAllComplete ? "أحسنت! أتممت مهمّة الانطلاق الأولى 🎉" : "✨ مهمّتك الأولى: أشعل شرارتك في وَمِيض"}
                </h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {completedCount} من {questSteps.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted sm:text-sm">
                {isAllComplete
                  ? "أنت الآن جاهز للمضي قدماً في مغامرتك البرمجية نحو رتبة المجرة!"
                  : "أربع خطوات بسيطة ستجعلك تتقن التعامل مع المنصة وتبدأ بقوة:"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setGuideOpen(true)}
              className="gap-1.5 border-line bg-surface-2 text-xs font-medium sm:text-sm"
            >
              <HelpCircle className="size-4 text-primary" />
              دليل البداية السريع
            </Button>
            {isAllComplete && (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-xs text-muted hover:text-fg hover:underline"
              >
                إخفاء
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative mt-4">
          <ProgressBar value={Math.round((completedCount / questSteps.length) * 100)} height={7} />
        </div>

        {/* Quest Grid */}
        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {questSteps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200",
                  step.done
                    ? "border-mint/30 bg-mint/5"
                    : "border-line bg-surface-2/60 hover:border-primary/40 hover:bg-surface-2"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={cn(
                        "grid size-9 place-items-center rounded-xl text-sm font-semibold",
                        step.done
                          ? "bg-mint text-white shadow-sm"
                          : "bg-surface text-muted border border-line"
                      )}
                    >
                      <IconComponent className="size-4" />
                    </div>
                    {step.done ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-mint">
                        <CheckCircle2 className="size-4" /> مكتمل
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Circle className="size-3.5" /> الخطوة {idx + 1}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-fg">{step.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{step.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-line/60">
                  <Link
                    href={step.href}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold transition-colors",
                      step.done
                        ? "text-muted hover:text-fg"
                        : "text-primary hover:text-primary-hover group-hover:translate-x-[-2px] transition-transform"
                    )}
                  >
                    {step.actionText} <ArrowLeft className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Student Guide Modal */}
      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="🚀 كيف تنطلق في وَمِيض؟ (دليل المبرمج الجديد)"
        description="كل ما تحتاجه لفهم المنصة، حل المهام، واستخدام المساعد الذكي."
        size="lg"
      >
        <div className="space-y-6 text-sm">
          {/* Tabs header */}
          <div className="flex flex-wrap gap-2 border-b border-line pb-3">
            {[
              { id: "learn", label: "1. الدروس والمسار 🗺️", icon: Route },
              { id: "tasks", label: "2. حل المهام والتسليم 💻", icon: Code2 },
              { id: "ai", label: "3. رفيقك «ومضة AI» 🤖", icon: Bot },
              { id: "rewards", label: "4. النقاط والرتب 🎮", icon: Trophy },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm",
                    activeTab === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface-2 text-muted hover:bg-surface-3 hover:text-fg"
                  )}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Learn & Roadmap */}
          {activeTab === "learn" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-fg">
                <h4 className="flex items-center gap-2 font-bold text-primary">
                  <Compass className="size-5" /> مسارك التعليمي المخصص
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-muted">
                  المحتوى في وَمِيض مقسم إلى <strong>مستويات (Levels)</strong> بداخل كل مستوى دورات ودروس تفاعلية تفتح تباعاً بحسب تقدمك.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                  <div className="font-semibold text-fg">📖 داخل كل درس:</div>
                  <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-muted list-disc list-inside">
                    <li>ستجد شرحاً مبسطاً مدعوماً بأمثلة عملية وكود توضيحي.</li>
                    <li>يمكنك نسخ الكود أو تجربته مباشرة.</li>
                    <li>المحتوى مقسم لفقرات صغيرة لسهولة الفهم.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                  <div className="font-semibold text-fg">✍️ اختبار الفهم (Quiz):</div>
                  <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-muted list-disc list-inside">
                    <li>في نهاية كل درس يوجد سؤال أو سؤالان سريعان.</li>
                    <li>الإجابة الصحيحة تمنحك <strong>نقاط XP</strong> فورية وتفتح الدرس التالي.</li>
                    <li>إذا أخطأت، يوضح لك الاختبار سبب الخطأ لتتعلم منه!</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Button href="/roadmap" onClick={() => setGuideOpen(false)} className="gap-2">
                  <Play className="size-4 fill-current" /> توجه إلى مسارك الآن
                </Button>
              </div>
            </div>
          )}

          {/* Tab 2: Tasks & Submissions */}
          {activeTab === "tasks" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="rounded-2xl border border-mint/20 bg-mint/5 p-4 text-fg">
                <h4 className="flex items-center gap-2 font-bold text-mint">
                  <Code2 className="size-5" /> ساحة التدريب البرمجي والمهام
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-muted">
                  البرمجة تصقل بالتطبيق العملي! ستجد في صفحة «مهامي» كل ما تحتاجه لتطبيق الدروس عملياً.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex gap-3 rounded-2xl border border-line bg-surface-2/60 p-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber/15 font-bold text-amber">
                    1
                  </span>
                  <div>
                    <div className="font-semibold text-fg">اختر المهمة واقرأ المطلوب بدقة</div>
                    <div className="text-xs sm:text-sm text-muted">
                      تتنوع المهام بين واجبات سهلة، تحديات خوارزمية 🔥، ومشاريع برمجية 🏆.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-line bg-surface-2/60 p-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/15 font-bold text-primary">
                    2
                  </span>
                  <div>
                    <div className="font-semibold text-fg">اكتب الكود في المحرر وسلّمه</div>
                    <div className="text-xs sm:text-sm text-muted">
                      اكتب حلك في محرر الكود المدمج بالصفحة، واكتب أي توضيح أو فكرة في صندوق الملاحظات ثم اضغط «تسليم».
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-line bg-surface-2/60 p-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-mint/15 font-bold text-mint">
                    3
                  </span>
                  <div>
                    <div className="font-semibold text-fg">المراجعة والتقييم الشخصي من المعلم</div>
                    <div className="text-xs sm:text-sm text-muted">
                      يقوم المعلم بمراجعة كل سطر، ويعطيك نصائح لتطوير كودك، وتصلك إشعار فوري عند قبول الحل مع مكافأة الـ XP!
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Button href="/tasks" onClick={() => setGuideOpen(false)} className="gap-2">
                  <ListChecks className="size-4" /> استكشف قائمة المهام
                </Button>
              </div>
            </div>
          )}

          {/* Tab 3: AI Assistant */}
          {activeTab === "ai" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="rounded-2xl border border-sky/20 bg-sky/5 p-4 text-fg">
                <h4 className="flex items-center gap-2 font-bold text-sky">
                  <Bot className="size-5" /> «ومضة AI» مدرّبك الذكي المتاح 24/7
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-muted">
                  صُمم المساعد لمساعدتك في التفكير وحل المشاكل البرمجية كالمحترفين، وليس لمجرد إعطائك الحل جاهزاً!
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                  <div className="flex items-center gap-1.5 font-semibold text-mint">
                    <CheckCircle2 className="size-4" /> كيف يساعدك ومضة؟
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-muted list-disc list-inside">
                    <li>شرح رسائل الأخطاء (Error Messages) الغامضة.</li>
                    <li>توضيح المفاهيم البرمجية بأمثلة بسيطة.</li>
                    <li>تقديم تلميحات ذكية توجهك للخطوة القادمة.</li>
                    <li>مراجعة جودة الكود وتسمية المتغيرات.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                  <div className="flex items-center gap-1.5 font-semibold text-coral">
                    <Lightbulb className="size-4" /> القاعدة الذهبية
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted">
                    لن يكتب ومضة الكود نيابة عنك لحل الواجبات أو التحديات؛ لأن المبرمج الحقيقي يبني عضلاته العقلية بحل المشاكل بنفسه!
                  </p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Button href="/assistant" onClick={() => setGuideOpen(false)} className="gap-2">
                  <Bot className="size-4" /> تحدث مع ومضة الآن
                </Button>
              </div>
            </div>
          )}

          {/* Tab 4: Rewards & Gamification */}
          {activeTab === "rewards" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="rounded-2xl border border-amber/20 bg-amber/5 p-4 text-fg">
                <h4 className="flex items-center gap-2 font-bold text-amber">
                  <Trophy className="size-5" /> سلّم الرتب والتحدي: من الشرارة إلى المجرّة ✨
                </h4>
                <p className="mt-1 text-xs sm:text-sm text-muted">
                  كل خطوة تخطوها في وَمِيض محسوبة وتصنع فارقاً في مستواك وترتيبك!
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-surface-2/60 p-4 text-center">
                  <div className="mx-auto grid size-10 place-items-center rounded-xl bg-amber/15 text-amber">
                    <Zap className="size-5 fill-current" />
                  </div>
                  <div className="mt-2 font-bold text-fg">نقاط الخبرة (XP)</div>
                  <p className="mt-1 text-xs text-muted">اكسبها من إكمال الدروس، الاختبارات، وحل المهام لترقية رتبتك.</p>
                </div>

                <div className="rounded-2xl border border-line bg-surface-2/60 p-4 text-center">
                  <div className="mx-auto grid size-10 place-items-center rounded-xl bg-coral/15 text-coral">
                    <Flame className="size-5 fill-current" />
                  </div>
                  <div className="mt-2 font-bold text-fg">السلسلة اليومية 🔥</div>
                  <p className="mt-1 text-xs text-muted">تعلّم كل يوم ولو لـ 5 دقائق فقط لتحافظ على شعلتك مشتعلة ولا تكسر السلسلة!</p>
                </div>

                <div className="rounded-2xl border border-line bg-surface-2/60 p-4 text-center">
                  <div className="mx-auto grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Sparkles className="size-5" />
                  </div>
                  <div className="mt-2 font-bold text-fg">سلّم الرتب والأوسمة</div>
                  <p className="mt-1 text-xs text-muted">شرارة ➔ وهج ➔ شعلة ➔ نجم ➔ مذنّب ➔ مجرّة 🌌. واجمع أوسمة الإنجازات النادرة!</p>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Button href="/achievements" onClick={() => setGuideOpen(false)} className="gap-2">
                  <Trophy className="size-4" /> شاهد الأوسمة والرتب
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
