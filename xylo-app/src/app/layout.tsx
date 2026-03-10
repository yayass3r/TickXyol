import type { Metadata } from "next";
import ThemeProvider from "@/components/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "زايلو - منصة المقالات العربية",
  description: "منصة اجتماعية للمقالات باللغة العربية مع نظام دعم مالي للكُتّاب",
  keywords: "مقالات, كتابة, عربي, إبداع, قراءة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 dark:bg-gray-900 transition-colors">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
