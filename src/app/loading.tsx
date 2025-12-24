import { Spinner } from 'react-bootstrap';

export default function Loading() {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
            <Spinner animation="grow" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 text-muted fade-in">กำลังโหลดข้อมูล...</p>
        </div>
    );
}
