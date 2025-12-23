import './globals.scss';
import { Kanit } from 'next/font/google';
import ThemeProvider from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer'; // Import มา

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
  return (
    <html lang="th">
      <body className={`${kanit.className} d-flex flex-column min-vh-100`}> {/* เพิ่ม flex ให้ footer อยู่ล่างสุด */}
        <ThemeProvider>
          <Navbar />
          <main className="py-4 flex-grow-1"> {/* ให้ main ขยายเต็มพื้นที่ */}
            {children}
          </main>
          <Footer /> {/* ใส่ Footer ตรงนี้ */}
        </ThemeProvider>
      </body>
    </html>
  );
}