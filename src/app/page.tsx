// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Form, InputGroup } from 'react-bootstrap';
import CenterCard from '@/components/CenterCard';
import { Center } from '@/types';

export default function Home() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ฟังก์ชันดึงข้อมูลจาก API
  const fetchCenters = async () => {
    try {
      const res = await fetch('/api/centers');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setCenters(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
  }, []);

  // กรองข้อมูลตามคำค้นหา
  const filteredCenters = centers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      {/* Hero Section */}
      <div className="text-center py-5">
        <h1 className="display-5 fw-bold mb-3">🤝 ระบบช่วยเหลือผู้ประสบภัย</h1>
        <p className="lead text-muted">
          ร่วมบริจาคสิ่งของและช่วยเหลือศูนย์อพยพในพื้นที่
        </p>
      </div>

      {/* Search Bar */}
      <Row className="justify-content-center mb-5">
        <Col md={6}>
          <InputGroup size="lg">
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              placeholder="ค้นหาชื่อศูนย์ หรือ อำเภอ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      {/* Content */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <Row className="g-4">
          {filteredCenters.length > 0 ? (
            filteredCenters.map((center) => (
              <Col key={center._id} xs={12} md={6} lg={4}>
                <CenterCard center={center} />
              </Col>
            ))
          ) : (
            <div className="text-center text-muted py-5">
              ไม่พบข้อมูลศูนย์อพยพ
            </div>
          )}
        </Row>
      )}
    </Container>
  );
}