'use client';

import { Container } from 'react-bootstrap';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // ถ้าเป็นหน้า Admin หรือ Login ไม่ต้องโชว์ Footer
  if (pathname.startsWith('/admin') || pathname === '/login') return null;

  return (
    <footer className="py-4 mt-auto border-top bg-body-tertiary">
      <Container className="text-center text-muted small">
        <p className="mb-1">© 2025 ระบบบริหารจัดการศูนย์อพยพและของบริจาค (Donation System)</p>
        <p className="mb-0">พัฒนาเพื่อช่วยเหลือสังคม 💙</p>
      </Container>
    </footer>
  );
}