import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NODRA",
  description:
    "Self-hosted block notebook with journals, pages, and a page graph.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
