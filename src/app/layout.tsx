// src/app/layout.tsx
import './globals.scss';
import { Kanit } from 'next/font/google';
import ThemeProvider from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';

const kanit = Kanit({ 
  weight: ['300', '400', '500', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-kanit',
});

export const metadata = {
  title: 'ระบบบริหารจัดการของบริจาค (Donation)',
  description: 'เว็บจัดการรับบริจาคและเบิกของบริจาคการอพยพ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Script นี้จะทำงานก่อนที่หน้าเว็บจะแสดงผล ทำให้รู้ทันทีว่าต้องเป็นธีมอะไร
  const themeScript = `
    (function() {
      try {
        const storedTheme = localStorage.getItem('theme');
        const theme = storedTheme || 'light';
        document.documentElement.setAttribute('data-bs-theme', theme);
      } catch (e) {}
    })()
  `;

  return (
    <html lang="th">
      <body className={kanit.className}>
        {/* เพิ่มบรรทัดนี้ลงไปเป็นสิ่งแรกใน Body */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        
        <ThemeProvider>
          <Navbar />
          <main className="py-4">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}