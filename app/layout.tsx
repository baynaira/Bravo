import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Investment Admin Dashboard",
  description: "Admin-managed investor portal with role-based access."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
