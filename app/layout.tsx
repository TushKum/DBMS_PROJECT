import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/client/components/AppShell";

export const metadata: Metadata = {
  title: "STOCK.FLIX — One-stop streetwear stock tracker",
  description:
    "Live stock + price across Myntra, Flipkart, Ajio, The Souled Store, Bewakoof and Everdeon — for streetwear and Y2K drops.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
