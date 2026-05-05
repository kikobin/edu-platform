import type { Metadata } from "next";
import "@/styles/globals.css";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export const metadata: Metadata = {
  title: "AI Trend — готовим к новому будущему",
  description: "AI Trend — платформа сопровождения онлайн-уроков для школьников",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
