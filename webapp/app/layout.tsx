import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Freelance Hunter",
  description: "Daily freelance opportunities dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
