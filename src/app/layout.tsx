import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Dashboard Padi 2025",
  description: "Analisis produksi dan konsumsi beras Indonesia per provinsi, 2025",
};

// Default terang; mode gelap hanya kalau pengguna memilihnya lewat tombol tema.
// Class .dark dipasang sebelum render supaya tidak berkedip saat memuat.
const themeScript = `try{var t=localStorage.getItem('tema');if(t==='gelap')document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
