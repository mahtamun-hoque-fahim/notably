import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notably — Voice Notes, Instantly",
  description: "Speak your thoughts. Notably converts your voice to text in real time. No account needed. 10 notes a day, no clutter.",
  keywords: ["voice to text", "note taking", "speech recognition", "voice notes"],
  openGraph: {
    title: "Notably — Voice Notes, Instantly",
    description: "Speak your thoughts. Notably converts your voice to text in real time.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
