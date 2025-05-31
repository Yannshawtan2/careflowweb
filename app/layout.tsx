'use client';
import type { Metadata } from "next";
import { Inter as FontSans, Geist_Mono as FontMono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Main } from "@/components/ds";

const fontSans = FontSans({
  variable: "--font-font-sans",
  subsets: ["latin"],
});

const fontMono = FontMono({
  variable: "--font-font-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Main className="flex-1">{children}</Main>
        </ThemeProvider>
      </body>
    </html>
  );
}
