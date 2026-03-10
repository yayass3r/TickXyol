import type { Metadata } from "next";
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
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
