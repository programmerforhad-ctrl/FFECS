import "./globals.css";
import type { Metadata, Viewport } from "next";
import { DEFAULT_NAME } from "@/lib/settings";

export const metadata: Metadata = {
  title: DEFAULT_NAME,
  description: "Official website of Free Fire E-Sports Community Sylhet.",
};

export const viewport: Viewport = {
  themeColor: "#061512",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Figtree:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
