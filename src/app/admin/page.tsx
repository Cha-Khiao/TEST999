// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Container, Table, Button, Badge, Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import Swal from 'sweetalert2';
import ReceiveModal from './ReceiveModal';
import DistributeModal from './DistributeModal';
import SummaryChart from '@/components/SummaryChart';

export default function AdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);

  // ฟังก์ชันโหลดข้อมูลทั้งหมด
  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, transRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/transactions')
      ]);
      setItems(await itemsRes.json());
      setTransactions(await transRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ฟังก์ชันอนุมัติการบริจาค (เปลี่ยน Pending -> Completed)
  const handleApprove = async (transId: string, itemName: string, qty: number) => {
    const result = await Swal.fire({
      title: 'ยืนยันรับของบริจาค?',
      text: `รายการ: ${itemName} จำนวน ${qty}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันรับเข้าสต็อก',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/transactions/${transId}`, { method: 'PUT' });
        if (!res.ok) throw new Error('Failed');
        
        Swal.fire('สำเร็จ', 'นำของเข้าสต็อกเรียบร้อย', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
      }
    }
  };

  // แยกข้อมูล Transaction
  const pendingDonations = transactions.filter(t => t.status === 'PENDING');
  const historyLogs = transactions.filter(t => t.status === 'COMPLETED');

  // Utility: Format Date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">🛡️ Admin Dashboard</h2>
          <p className="text-muted mb-0">ระบบบริหารจัดการทรัพยากรฉุกเฉิน</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="success" onClick={() => setShowReceiveModal(true)}>📥 รับของเข้า</Button>
          <Button variant="warning" onClick={() => setShowDistributeModal(true)}>📤 เบิกจ่ายออก</Button>
        </div>
      </div>

      {/* กราฟแสดงผล (เพิ่มใหม่) */}
      {!loading && <SummaryChart items={items} />}

      {/* Tabs Menu */}
      <Card className="shadow-sm border-0">
        <Card.Body>
          <Tabs defaultActiveKey="stock" id="admin-tabs" className="mb-3" fill>
            
            {/* TAB 1: STOCK */}
            <Tab eventKey="stock" title={`📦 คลังสินค้า (${items.length})`}>
              {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : (
                <Table hover responsive className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ชื่อสินค้า</th>
                      <th>หมวดหมู่</th>
                      <th className="text-end">คงเหลือ</th>
                      <th className="text-center">หน่วย</th>
                      <th>อัปเดตล่าสุด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length > 0 ? items.map((item) => (
                      <tr key={item._id}>
                        <td className="fw-bold">{item.name}</td>
                        <td><Badge bg="light" text="dark" className="border">{item.category}</Badge></td>
                        <td className={`text-end fw-bold ${item.quantity < 10 ? 'text-danger' : 'text-success'}`}>
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="text-center text-muted">{item.unit}</td>
                        <td className="text-muted small">{formatDate(item.updatedAt)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="text-center text-muted py-4">ไม่มีสินค้าในคลัง</td></tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Tab>

            {/* TAB 2: PENDING APPROVAL */}
            <Tab eventKey="pending" title={
              <span>⏳ รออนุมัติ {pendingDonations.length > 0 && <Badge bg="danger" pill>{pendingDonations.length}</Badge>}</span>
            }>
               <Table hover responsive className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>วันที่แจ้ง</th>
                      <th>ผู้บริจาค</th>
                      <th>รายการ</th>
                      <th>จำนวน</th>
                      <th>ให้ศูนย์ฯ</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDonations.length > 0 ? pendingDonations.map(t => (
                      <tr key={t._id}>
                        <td>{formatDate(t.createdAt)}</td>
                        <td>{t.donorName}</td>
                        <td className="fw-bold text-primary">{t.itemId?.name || 'ไม่ระบุ'}</td>
                        <td>{t.quantity.toLocaleString()} {t.itemId?.unit}</td>
                        <td>{t.centerId?.name}</td>
                        <td>
                          <Button size="sm" variant="outline-success" 
                            onClick={() => handleApprove(t._id, t.itemId?.name, t.quantity)}>
                            ✅ ยืนยันรับ
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className="text-center py-4 text-muted">ไม่มีรายการรออนุมัติ</td></tr>
                    )}
                  </tbody>
                </Table>
            </Tab>

            {/* TAB 3: HISTORY LOGS */}
            <Tab eventKey="history" title="📜 ประวัติย้อนหลัง">
               <Table hover responsive className="align-middle small">
                  <thead className="table-light">
                    <tr>
                      <th>เวลา</th>
                      <th>ประเภท</th>
                      <th>รายการ</th>
                      <th>จำนวน</th>
                      <th>รายละเอียด (ผู้ให้/ผู้รับ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLogs.length > 0 ? historyLogs.map(t => (
                      <tr key={t._id}>
                        <td>{formatDate(t.createdAt)}</td>
                        <td>
                          <Badge bg={t.type === 'IN' ? 'success' : 'warning'} text={t.type === 'OUT' ? 'dark' : 'white'}>
                            {t.type === 'IN' ? 'รับเข้า' : 'เบิกออก'}
                          </Badge>
                        </td>
                        <td>{t.itemId?.name}</td>
                        <td className="fw-bold">{t.quantity.toLocaleString()}</td>
                        <td>
                          {t.type === 'IN' ? (
                            <span>ผู้บริจาค: {t.donorName || '-'}</span>
                          ) : (
                            <span>ไปยัง: {t.centerId?.name} (โดย {t.requesterName})</span>
                          )}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="text-center py-4 text-muted">ยังไม่มีประวัติรายการ</td></tr>
                    )}
                  </tbody>
                </Table>
            </Tab>

          </Tabs>
        </Card.Body>
      </Card>

      <ReceiveModal show={showReceiveModal} onHide={() => setShowReceiveModal(false)} onSuccess={fetchData} />
      <DistributeModal show={showDistributeModal} onHide={() => setShowDistributeModal(false)} onSuccess={fetchData} />
    </Container>
  );
}