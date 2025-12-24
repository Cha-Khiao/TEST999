// src/app/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Spinner, Form, InputGroup, Pagination } from 'react-bootstrap';
import CenterCard from '@/components/CenterCard';
import { Center } from '@/types';

// ใช้ Debounce เพื่อลดการยิง API ถี่เกินไปเวลาพิมพ์ค้นหา
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function Home() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Server-side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search term logic (รอคนพิมพ์เสร็จ 500ms ค่อยยิง API)
  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetchCenters = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      // สร้าง Query String สำหรับส่งไปหา Server
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        search: search,
        type: 'DONATION_POINT'
      });

      const res = await fetch(`/api/centers?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const result = await res.json();

      // *** FIX: รับค่าจากโครงสร้าง { data, meta } ให้ถูกต้อง ***
      if (result.data) {
        setCenters(result.data);
        setTotalPages(result.meta.totalPages);
      } else {
        setCenters([]);
      }
    } catch (error) {
      console.error(error);
      setCenters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // เมื่อ Search หรือ Page เปลี่ยน ให้ดึงข้อมูลใหม่
  useEffect(() => {
    fetchCenters(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchCenters]);

  // เมื่อเริ่มพิมพ์คำค้นหาใหม่ ให้รีเซ็ตกลับไปหน้า 1 เสมอ
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);


  // ฟังก์ชันเปลี่ยนหน้า
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // สร้างปุ่ม Pagination แบบฉลาด
  const renderPaginationItems = () => {
    let items = [];
    const maxButtons = 5;
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
          ร่วมบริจาคสิ่งของได้ที่ <strong>จุดรับบริจาค</strong> ใกล้บ้านท่าน
        </p>
      </div>

      {/* Search Bar */}
      <Row className="justify-content-center mb-4">
        <Col md={6}>
          <InputGroup size="lg" className="shadow-sm">
            <InputGroup.Text className="bg-body">🔍</InputGroup.Text>
            <Form.Control
              placeholder="ค้นหาจุดรับบริจาค หรือ อำเภอ..."
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
            {centers.length > 0 ? (
              centers.map((center) => (
                <Col key={center._id} xs={12} md={6} lg={4}>
                  <CenterCard center={center} />
                </Col>
              ))
            ) : (
              <div className="text-center text-muted py-5">
                ไม่พบข้อมูลจุดรับบริจาคที่ค้นหา
              </div>
            )}
          </Row>

          {/* Pagination Controls */}
          {totalPages > 1 && (
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