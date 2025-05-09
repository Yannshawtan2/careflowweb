'use client';
import type { Metadata } from "next";
import { Inter as FontSans, Geist_Mono as FontMono } from "next/font/google";
import "./globals.css";

import Link from "next/link";

import { Nav, Section, Container, Main } from "@/components/ds";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Button } from "@/components/ui/button";
import { AdminHeader } from "@/components/AdminHeader";
import { StaffHeader } from "@/components/StaffHeader";
import { getCookie } from '@/lib/cookies';
import { useEffect, useState } from 'react';

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
  const [userRole, setUserRole] = useState<string | undefined>();

  useEffect(() => {
    const role = getCookie('userRole');
    setUserRole(role);
  }, []);

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
          {userRole === "admin" ? <AdminHeader /> : <StaffHeader />}
          <Main className="flex-1">{children}</Main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

const Footer = () => {
  return (
    <footer>
      <Section className="border-t bg-accent/30">
        <Container className="space-y-2">
          <Link className="font-semibold tracking-tight block" href="/">
            Logo
          </Link>
          <p className="text-muted-foreground text-sm">
            © 2025 Logo. All rights reserved.
          </p>
          <ModeToggle />
        </Container>
      </Section>
    </footer>
  );
};
