import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexum Content Hub",
  description: "CMS SaaS para administrar contenido dinamico por proyecto.",
  icons: {
    icon: [{ url: "/images/image_2.png", type: "image/png" }],
    shortcut: "/images/image_2.png",
    apple: "/images/image_2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
