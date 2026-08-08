import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import ApiKeyCapture from "@/components/ApiKeyCapture";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "CallSense AI",
  description: "Call intelligence dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("callsense_theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}`,
          }}
        />
        <ApiKeyCapture />
        <NavBar />
        <main className="flex-1 px-8 pt-10 pb-16">
          <div className="mx-auto" style={{ maxWidth: 1180 }}>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
