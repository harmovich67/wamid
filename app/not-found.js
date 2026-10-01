import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <div className="mx-auto w-fit animate-float opacity-80">
          <LogoMark size={80} />
        </div>
        <div className="mt-6 font-mono text-6xl font-bold text-gradient">404</div>
        <h1 className="mt-3 text-2xl font-bold">انطفأت الشرارة هنا!</h1>
        <p className="mt-2 text-muted">الصفحة التي تبحث عنها غير موجودة أو لا تملك صلاحية الوصول إليها.</p>
        <Button href="/" className="mt-6">العودة للرئيسية</Button>
      </div>
    </main>
  );
}
