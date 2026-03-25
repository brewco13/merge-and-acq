import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Merge & ACQ Tool",
  description: "Internal application rationalization tool for M&A planning",
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
