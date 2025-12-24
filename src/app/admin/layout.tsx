'use client';

import { Container, Row, Col } from 'react-bootstrap';
// ไม่ต้อง import globals.css หรือ bootstrap ที่นี่ เพราะ root layout โหลดให้แล้ว
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container fluid style={{ minHeight: '100vh', padding: 0 }} className="bg-body-tertiary">
      <Row className="g-0 min-vh-100">
        
        {/* Sidebar (Desktop) */}
        <Col md={3} lg={2} className="bg-body border-end d-none d-md-flex flex-column" style={{ minHeight: '100vh', position: 'sticky', top: 0, zIndex: 1020 }}>
          <AdminSidebar />
        </Col>
        
        {/* Sidebar (Mobile) */}
        <Col xs={12} className="d-md-none bg-body border-bottom">
           <AdminSidebar mobile /> 
        </Col>

        {/* Main Content */}
        <Col xs={12} md={9} lg={10} className="p-4">
          {children}
        </Col>
      </Row>
    </Container>
  );
}