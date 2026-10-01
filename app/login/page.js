import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "تسجيل الدخول" };

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  const safeNext = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null;

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="w-fit">
          <Logo size={40} />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold tracking-tight">أهلًا بعودتك ✨</h1>
          <p className="mt-2 text-muted">سجّل الدخول لتكمل رحلتك من حيث توقفت.</p>
          <LoginForm next={safeNext} />
          <p className="mt-8 text-center text-sm text-muted">
            ليس لديك حساب؟ الحسابات يُنشئها المعلّم — تواصل معه للحصول على بيانات الدخول.
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-[#110d26] lg:block">
        <div className="bg-grid absolute inset-0 opacity-[0.12]" />
        <div className="absolute -top-40 -start-40 size-[520px] rounded-full bg-primary/40 blur-[120px]" />
        <div className="absolute -bottom-40 -end-20 size-[420px] rounded-full bg-amber/25 blur-[120px]" />
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-center text-white">
          <div className="animate-float">
            <LogoMark size={120} animated />
          </div>
          <h2 className="mt-10 text-4xl font-bold leading-tight">
            كل مبرمج عظيم
            <br />
            <span className="text-gradient">بدأ بشرارة</span>
          </h2>
          <p className="mt-4 max-w-md text-white/65">
            من أول سطر كود إلى أول مشروع حقيقي — مسار واضح، تحديات ممتعة، ومساعد ذكي بجانبك دائمًا.
          </p>
          <div className="mt-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 text-start font-mono text-sm backdrop-blur" dir="ltr">
            <div className="mb-3 flex gap-1.5">
              <span className="size-2.5 rounded-full bg-coral" />
              <span className="size-2.5 rounded-full bg-amber" />
              <span className="size-2.5 rounded-full bg-mint" />
            </div>
            <div><span className="text-[#b69cff]">def</span> <span className="text-[#6cc9ff]">spark</span>(<span className="text-[#ffd9a0]">idea</span>):</div>
            <div className="ps-6"><span className="text-[#b69cff]">return</span> idea + <span className="text-[#7ee2c1]">&quot;code&quot;</span> + <span className="text-[#7ee2c1]">&quot;practice&quot;</span></div>
            <div className="mt-2 text-white/40"># → a real developer 🚀</div>
          </div>
        </div>
      </section>
    </main>
  );
}
