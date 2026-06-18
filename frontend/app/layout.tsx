import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareerTwin AI — Know how employable you really are",
  description:
    "CareerTwin builds a digital intelligence profile from your resume and GitHub, then scores your real employability.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Apply the saved theme before first paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/* ── Global animated background layer ──────────────────────── */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          {/* Orb 1 — top-right, brand violet */}
          <div className="bg-orb-1 absolute -top-52 -right-32 h-[760px] w-[760px] rounded-full blur-[120px] animate-float-y" />
          {/* Orb 2 — bottom-left, brand blue */}
          <div className="bg-orb-2 absolute -bottom-48 -left-32 h-[640px] w-[640px] rounded-full blur-[110px] animate-float-y-slow" />
          {/* Orb 3 — center, purple accent */}
          <div className="bg-orb-3 absolute top-[38%] left-[42%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] animate-float-xy" />
          {/* Mesh grid */}
          <div className="absolute inset-0 mesh-grid" />
        </div>

        {children}
      </body>
    </html>
  );
}
