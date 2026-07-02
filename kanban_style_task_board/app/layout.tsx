import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanban Task Board",
  description: "Be more productive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>{children}</body>
    </html>
  );
}
