import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { VT323, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/hooks/use-theme";
import { CookieConsent } from "@/components/cookie-consent";
import { THEME_STORAGE_KEY, DEFAULT_THEME } from "@/lib/theme";
import "./globals.css";

const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Track Your Future",
  description:
    "Job search command center. Track applications, manage documents, and get AI-powered insights.",
};

const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="green"||t==="amber"){document.documentElement.setAttribute("data-theme",t)}else{document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}")}}catch(e){document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}")}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="green" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${vt323.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider>
            {children}
            <CookieConsent />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
