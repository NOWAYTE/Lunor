import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "~/components/ui/sonner";
import { Providers } from "~/components/provider";
import { ThemeProvider } from "~/components/theme-provider";

export const metadata: Metadata = {
  title: "Lunor",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body className="flex min-h-svh items-center justify-center">
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <Providers>
        {children}
        <Toaster />
        </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
