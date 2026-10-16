import type { Metadata } from "next";
import "./globals.css";
import { UserProgressProvider } from "@/context/UserProgressContext";
import { TopHudBar } from "@/components/shop/TopHudBar";
import { CandyShopModal } from "@/components/shop/CandyShopModal";

export const metadata: Metadata = {
  title: "MENTORS | Autonomous AI Mentor Agents (Gemini 4 Argon & Rive)",
  description:
    "Apple Watch-inspired Rive mentor bubble launcher, Gemini 4 Argon interactive 3D previews, autonomous skill assessment, quizzes, and Duolingo-style Candy rewards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#060913] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200">
        <UserProgressProvider>
          <div className="relative flex min-h-screen flex-col">
            <TopHudBar />
            <main className="flex-1">{children}</main>
            <CandyShopModal />
          </div>
        </UserProgressProvider>
      </body>
    </html>
  );
}
