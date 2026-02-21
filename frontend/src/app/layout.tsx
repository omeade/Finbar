import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InvestIQ — AI Investment Coach",
  description: "A beginner-friendly, AI-powered investment onboarding experience.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
