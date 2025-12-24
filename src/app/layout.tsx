import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap ต้องอยู่ที่นี่
import './globals.scss'; // Global CSS ต้องอยู่ที่นี่
import type { Metadata } from 'next';
import { Kanit } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-kanit',
});

export const metadata: Metadata = {
  title: 'ระบบบริหารจัดการศูนย์อพยพ',
  description: 'Donation & Shelter Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={kanit.className}>
        <ThemeProvider>
          <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-grow-1">
              {children}
            </main>
            <Footer />
            <ScrollToTop />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}