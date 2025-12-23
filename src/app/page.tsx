// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Form, InputGroup, Pagination } from 'react-bootstrap';
import CenterCard from '@/components/CenterCard';
import { Center } from '@/types';

export default function Home() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State สำหรับ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // แสดงหน้าละ 12 การ์ด (กำลังดี ไม่หนักเครื่อง)

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

  // เมื่อมีการค้นหา ให้รีเซ็ตกลับไปหน้า 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Logic การกรองและแบ่งหน้า
  const filteredCenters = centers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCenters.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCenters.length / itemsPerPage);

  // ฟังก์ชันเปลี่ยนหน้า
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // สร้างปุ่ม Pagination แบบฉลาด (ไม่โชว์ยาวเหยียดถ้าหน้าเยอะ)
  const renderPaginationItems = () => {
    let items = [];
    const maxButtons = 5; // จำนวนปุ่มตัวเลขที่จะโชว์
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item key={number} active={number === currentPage} onClick={() => paginate(number)}>
          {number}
        </Pagination.Item>,
      );
    }
    return items;
  };

  return (
    <Container>
      {/* Hero Section */}
      <div className="text-center py-5">
        <h1 className="display-5 fw-bold mb-3">🤝 ระบบช่วยเหลือผู้ประสบภัย</h1>
        <p className="lead text-muted">
          ร่วมบริจาคสิ่งของและช่วยเหลือศูนย์อพยพในพื้นที่ ({centers.length} ศูนย์)
        </p>
      </div>

      {/* Search Bar */}
      <Row className="justify-content-center mb-4">
        <Col md={6}>
          <InputGroup size="lg" className="shadow-sm">
            <InputGroup.Text className="bg-body">🔍</InputGroup.Text>
            <Form.Control
              placeholder="ค้นหาชื่อศูนย์ หรือ อำเภอ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0"
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
        <>
          <Row className="g-4 mb-5">
            {currentItems.length > 0 ? (
              currentItems.map((center) => (
                <Col key={center._id} xs={12} md={6} lg={4}>
                  <CenterCard center={center} />
                </Col>
              ))
            ) : (
              <div className="text-center text-muted py-5">
                ไม่พบข้อมูลศูนย์อพยพที่ค้นหา
              </div>
            )}
          </Row>

          {/* Pagination Controls */}
          {filteredCenters.length > itemsPerPage && (
            <div className="d-flex justify-content-center pb-5">
              <Pagination>
                <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                
                {renderPaginationItems()}
                
                <Pagination.Next onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => paginate(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
}