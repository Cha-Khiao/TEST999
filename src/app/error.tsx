'use client';

import { useEffect } from 'react';
import { Container, Button } from 'react-bootstrap';
import { XCircle } from 'react-bootstrap-icons';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
            <XCircle className="text-danger mb-4" size={80} />
            <h2 className="fw-bold mb-3">เกิดข้อผิดพลาดบางอย่าง!</h2>
            <p className="text-muted mb-4 text-center">
                ขออภัยในความไม่สะดวก ระบบเกิดปัญหาขัดข้องชั่วคราว
            </p>
            <div className="d-flex gap-3">
                <Button
                    variant="outline-secondary"
                    onClick={() => window.location.href = '/'}
                >
                    กลับหน้าหลัก
                </Button>
                <Button
                    variant="danger"
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                >
                    ลองใหม่อีกครั้ง
                </Button>
            </div>
        </Container>
    );
}
