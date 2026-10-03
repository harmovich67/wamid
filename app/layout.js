import { Readex_Pro, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { THEME_SCRIPT } from "@/components/ui/ThemeToggle";
import "./globals.css";

const readex = Readex_Pro({
  variable: "--font-readex",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "وَمِيض · Wameed — أكاديمية البرمجة",
    template: "%s · وَمِيض",
  },
  description: "وَمِيض: رحلة تعلّم برمجة تفاعلية تأخذك من أساسيات الحاسوب إلى بناء مشاريع حقيقية.",
  applicationName: "Wameed",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a18" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${readex.variable} ${jetbrains.variable} h-full antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        {children}
        <Toaster position="top-center" dir="rtl" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-readex)" } }} />
      </body>
    </html>
  );
}
