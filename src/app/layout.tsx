import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PyQuest — Gamified Python Learning Platform",
  description: "Learn Python through interactive, bite-sized lessons, in-browser code execution, and gamified challenges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--stone-50)] text-[var(--stone-900)] antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-[var(--stone-900)] focus:px-4 focus:py-2 focus:text-[var(--stone-50)] focus:ring-2 focus:ring-[var(--mint-500)]"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
