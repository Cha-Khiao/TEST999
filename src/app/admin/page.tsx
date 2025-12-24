'use client';

import { useEffect, useState } from 'react';
import { Card, Spinner, Row, Col } from 'react-bootstrap';
import { BoxSeam, GeoAltFill, HouseDoorFill, PeopleFill } from 'react-bootstrap-icons';
import SummaryChart from '@/components/SummaryChart';

export default function AdminDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ points: 0, shelters: 0, items: 0, totalStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. ดึงข้อมูลสินค้า (ทั้งหมดเพื่อทำ Report)
        const itemsRes = await fetch('/api/items?limit=1000');
        const itemsData = await itemsRes.json();
        const allItems = itemsData.data || [];

        // 2. ดึงยอด "จุดรับบริจาค" (ขอแค่ 1 รายการเพื่อเอา meta.total)
        const pointsRes = await fetch('/api/centers?type=DONATION_POINT&limit=1');
        const pointsData = await pointsRes.json();

        // 3. ดึงยอด "ศูนย์อพยพ" (ขอแค่ 1 รายการเพื่อเอา meta.total)
        const sheltersRes = await fetch('/api/centers?type=SHELTER&limit=1');
        const sheltersData = await sheltersRes.json();

        setItems(allItems);
        setStats({
          points: pointsData.meta?.total || 0,     // ยอดรวมจาก DB จริงๆ
          shelters: sheltersData.meta?.total || 0, // ยอดรวมจาก DB จริงๆ
          items: itemsData.meta?.total || allItems.length,
          totalStock: allItems.reduce((sum: number, i: any) => sum + i.quantity, 0)
        });

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h2 className="fw-bold">📊 ภาพรวมระบบ (Dashboard)</h2>
        <p className="text-muted">สรุปสถานการณ์และสถิติ</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <>
          <Row className="mb-4 g-3">
            {/* การ์ด 1: จุดรับบริจาค */}
            <Col md={3}>
              <Card className="bg-info text-white border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>
                    <h3 className="fw-bold mb-0">{stats.points.toLocaleString()}</h3>
                    <span className="small">จุดรับบริจาค (แห่ง)</span>
                  </div>
                  <BoxSeam size={32} className="opacity-50" />
                </Card.Body>
              </Card>
            </Col>

            {/* การ์ด 2: ศูนย์อพยพ */}
            <Col md={3}>
              <Card className="bg-primary text-white border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>
                    <h3 className="fw-bold mb-0">{stats.shelters.toLocaleString()}</h3>
                    <span className="small">ศูนย์อพยพ (แห่ง)</span>
                  </div>
                  <GeoAltFill size={32} className="opacity-50" />
                </Card.Body>
              </Card>
            </Col>

            {/* การ์ด 3: สินค้าคงคลัง */}
            <Col md={3}>
              <Card className="bg-success text-white border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>
                    <h3 className="fw-bold mb-0">{stats.items.toLocaleString()}</h3>
                    <span className="small">รายการสินค้า (SKU)</span>
                  </div>
                  <HouseDoorFill size={32} className="opacity-50" />
                </Card.Body>
              </Card>
            </Col>

            {/* การ์ด 4: ยอดรวมของ */}
            <Col md={3}>
              <Card className="bg-secondary text-white border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>
                    <h3 className="fw-bold mb-0">{stats.totalStock.toLocaleString()}</h3>
                    <span className="small">จำนวนของรวม (ชิ้น)</span>
                  </div>
                  <PeopleFill size={32} className="opacity-50" />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <SummaryChart items={items} />
        </>
      )}
    </div>
  );
}