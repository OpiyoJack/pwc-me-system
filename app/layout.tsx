import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Providers from "./components/Providers";
import TopBar from "./components/TopBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PWC M&E Platform",
  description: "Cloud-based Monitoring & Evaluation system for Pastoral Women's Council",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full" style={{ display: "flex", margin: 0 }}>
        <Providers>
          <Sidebar />
          <div style={{ flex: 1, minWidth: 0, background: "#EDE6D8", minHeight: "100vh" }}>
            <TopBar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
