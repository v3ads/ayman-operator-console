import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayman Operator Console",
  description: "Private VPS monitoring dashboard for Hermes operator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
