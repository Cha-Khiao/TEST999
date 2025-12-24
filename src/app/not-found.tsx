import Link from 'next/link';
import { Container, Button } from 'react-bootstrap';
import { ExclamationTriangle } from 'react-bootstrap-icons';

export default function NotFound() {
    return (
        <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
            <ExclamationTriangle className="text-warning mb-4" size={80} />
            <h1 className="fw-bold mb-3">ไม่พบหน้าที่ต้องการ (404)</h1>
            <p className="text-muted mb-4 text-center" style={{ maxWidth: '500px' }}>
                ขออภัย เราไม่พบหน้าที่คุณค้นหา อาจเป็นเพราะลิงก์ผิดพลาด หรือหน้านี้ได้ถูกลบออกไปแล้ว
            </p>
            <Link href="/" passHref>
                <Button variant="primary" size="lg" className="rounded-pill px-5 shadow-sm">
                    กลับสู่หน้าหลัก
                </Button>
            </Link>
        </Container>
    );
}
