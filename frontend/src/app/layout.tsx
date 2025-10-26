import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MadlenGPT",
  description: "Chat with OpenRouter models locally with full-stack telemetry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 antialiased">
        {children}
      </body>
    </html>
  );
}
