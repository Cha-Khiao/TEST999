'use client';
import { Container } from 'react-bootstrap';

export default function Footer() {
  return (
    <footer className="py-4 mt-auto border-top bg-body-tertiary">
      <Container className="text-center text-muted small">
        <p className="mb-1">© 2025 ระบบบริหารจัดการศูนย์อพยพและของบริจาค (Donation System)</p>
        <p className="mb-0">พัฒนาเพื่อช่วยเหลือสังคม 💙</p>
      </Container>
    </footer>
  );
}