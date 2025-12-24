'use client';

import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

// ต้องมีคำว่า export default function ตรงนี้ครับ
export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // ใช้ window.location.href เพื่อบังคับโหลดหน้าใหม่ (ให้ Navbar รู้ว่าล็อกอินแล้ว)
        window.location.href = '/admin';
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow border-0" style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <h3 className="fw-bold text-primary">🔐 Admin Login</h3>
            <p className="text-muted small">เข้าสู่ระบบจัดการศูนย์อพยพ</p>
          </div>

          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="ชื่อผู้ใช้งาน"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={loading} size="lg">
                {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
              </Button>
            </div>
          </Form>
        </Card.Body>
        <Card.Footer className="text-center bg-transparent border-top-0 pb-4">
            <small className="text-muted">สำหรับเจ้าหน้าที่เท่านั้น</small>
        </Card.Footer>
      </Card>
    </Container>
  );
}