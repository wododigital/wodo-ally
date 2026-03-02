import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "WODO Ally - Internal Management Platform",
  description: "Internal accounting and financial management platform for WODO Digital",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
