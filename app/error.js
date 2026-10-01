"use client";

import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export default function Error({ reset }) {
  return (
    <main className="grid min-h-[70dvh] place-items-center p-6 text-center">
      <div>
        <div className="mx-auto w-fit grayscale">
          <LogoMark size={72} />
        </div>
        <h1 className="mt-6 text-2xl font-bold">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-muted">لا تقلق — حتى أفضل المبرمجين يواجهون الأخطاء. جرّب مرة أخرى.</p>
        <Button onClick={() => reset()} className="mt-6">إعادة المحاولة</Button>
      </div>
    </main>
  );
}
