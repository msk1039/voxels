import type { Metadata } from "next";
import { Pixelify_Sans, Press_Start_2P, VT323 } from "next/font/google";

import { ProgressProvider } from "@/components/progress/progress-provider";
import { SettingsProvider } from "@/components/settings/settings-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const pixelBody = Pixelify_Sans({
  variable: "--font-pixel-body",
  subsets: ["latin"],
});

const pixelDisplay = Press_Start_2P({
  variable: "--font-pixel-display",
  subsets: ["latin"],
  weight: "400",
});

const pixelMono = VT323({
  variable: "--font-pixel-mono",
  subsets: ["latin"],
  weight: "400",
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
    <html lang="en" className="dark">
      <body
        className={`${pixelBody.variable} ${pixelDisplay.variable} ${pixelMono.variable} font-sans`}
      >
        <ProgressProvider>
          <SettingsProvider>
            <TooltipProvider>
              {children}
              <Toaster
                position="top-center"
                className="[--width:min(92vw,34rem)]"
              />
            </TooltipProvider>
          </SettingsProvider>
        </ProgressProvider>
      </body>
    </html>
  );
}
