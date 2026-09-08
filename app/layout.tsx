import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ProgressProvider } from "@/components/progress/progress-provider";
import { SettingsProvider } from "@/components/settings/settings-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Voxels",
    template: "%s · Voxels",
  },
  description: "Build two- and three-dimensional shapes with equations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ProgressProvider>
          <SettingsProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </SettingsProvider>
        </ProgressProvider>
      </body>
    </html>
  );
}
