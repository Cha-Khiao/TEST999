// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Container, Table, Button, Badge, Card, Spinner, Tab, Tabs } from 'react-bootstrap';
import Swal from 'sweetalert2';
import ReceiveModal from './ReceiveModal';
import DistributeModal from './DistributeModal';
import CenterManagementModal from './CenterManagementModal';
import SummaryChart from '@/components/SummaryChart';

export default function AdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showCenterModal, setShowCenterModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, transRes, centerRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/transactions'),
        // แก้ไขตรงนี้: เพิ่ม ?all=true เพื่อดึงศูนย์ทั้งหมดมาแสดงให้แอดมินเห็น
        fetch('/api/centers?all=true') 
      ]);
      setItems(await itemsRes.json());
      setTransactions(await transRes.json());
      setCenters(await centerRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ฟังก์ชันลบศูนย์
  const handleDeleteCenter = async (id: string, name: string) => {
    const result = await Swal.fire({
        title: `ลบศูนย์ ${name}?`,
        text: "การกระทำนี้ไม่สามารถย้อนกลับได้",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'ยืนยันลบ'
    });

    if (result.isConfirmed) {
        try {
            await fetch(`/api/centers/manage?id=${id}`, { method: 'DELETE' });
            Swal.fire('ลบสำเร็จ', '', 'success');
            fetchData();
        } catch (error) {
            Swal.fire('Error', 'ไม่สามารถลบได้', 'error');
        }
    }
  };

  const handleEditCenter = (center: any) => {
    setEditingCenter(center);
    setShowCenterModal(true);
  };

  const handleAddCenter = () => {
    setEditingCenter(null);
    setShowCenterModal(true);
  };

  const downloadCSV = () => {
    const headers = "Date,Type,Item,Quantity,Unit,Details,Status\n";
    const rows = transactions.map(t => {
        const date = new Date(t.createdAt).toLocaleDateString('th-TH');
        const type = t.type === 'IN' ? 'รับเข้า' : 'เบิกออก';
        const itemName = t.itemId?.name || '-';
        const unit = t.itemId?.unit || '-';
        const detail = t.type === 'IN' ? (t.donorName || '-') : (t.centerId?.name || '-');
        const safeDetail = `"${detail.replace(/"/g, '""')}"`; 
        return `${date},${type},${itemName},${t.quantity},${unit},${safeDetail},${t.status}`;
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `donation_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApprove = async (transId: string, itemName: string, qty: number) => {
    const result = await Swal.fire({
      title: 'ยืนยันรับของ?',
      text: `${itemName} จำนวน ${qty}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/transactions/${transId}`, { method: 'PUT' });
        Swal.fire('สำเร็จ', '', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', '', 'error');
      }
    }
  };

  const pendingDonations = transactions.filter(t => t.status === 'PENDING');
  const historyLogs = transactions.filter(t => t.status === 'COMPLETED');
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <Container>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">🛡️ Admin Dashboard</h2>
          <p className="text-muted mb-0">ระบบบริหารจัดการทรัพยากรฉุกเฉิน</p>
        </div>
        <div className="d-flex gap-2 flex-wrap justify-content-center">
           <Button variant="outline-primary" onClick={downloadCSV}>📄 Export CSV</Button>
           <Button variant="info" className="text-white" onClick={handleAddCenter}>🏥 เพิ่มศูนย์ใหม่</Button>
           <Button variant="success" onClick={() => setShowReceiveModal(true)}>📥 รับของเข้า</Button>
           <Button variant="warning" onClick={() => setShowDistributeModal(true)}>📤 เบิกจ่ายออก</Button>
        </div>
      </div>

      {!loading && <SummaryChart items={items} />}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Tabs defaultActiveKey="centers" id="admin-tabs" className="mb-3" fill>
            
            {/* TAB 1: CENTERS */}
            <Tab eventKey="centers" title={`🏥 จัดการศูนย์ (${centers.length})`}>
                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <Table hover className="align-middle text-nowrap">
                        <thead className="table-light sticky-top">
                            <tr>
                                <th>ชื่อศูนย์</th>
                                <th>อำเภอ</th>
                                <th>ประเภท</th>
                                <th>สถานะ</th>
                                <th className="text-end">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {centers.map(c => (
                                <tr key={c._id}>
                                    <td className="fw-bold">{c.name}</td>
                                    <td>{c.district}</td>
                                    <td><small className="text-muted">{c.shelterType}</small></td>
                                    <td>
                                        <Badge bg={c.status === 'active' ? 'success' : 'secondary'}>
                                            {c.status === 'active' ? 'เปิดใช้งาน' : 'ปิดชั่วคราว'}
                                        </Badge>
                                    </td>
                                    <td className="text-end">
                                        <Button size="sm" variant="outline-primary" className="me-1" onClick={() => handleEditCenter(c)}>✏️</Button>
                                        <Button size="sm" variant="outline-danger" onClick={() => handleDeleteCenter(c._id, c.name)}>🗑️</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </Tab>

            {/* TAB 2: STOCK */}
            <Tab eventKey="stock" title={`📦 คลังสินค้า (${items.length})`}>
              {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : (
                <div className="table-responsive">
                    <Table hover className="align-middle text-nowrap">
                    <thead className="table-light">
                        <tr>
                        <th>ชื่อสินค้า</th>
                        <th>หมวดหมู่</th>
                        <th className="text-end">คงเหลือ</th>
                        <th className="text-center">หน่วย</th>
                        <th>อัปเดต</th>
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
                        <tr><td colSpan={5} className="text-center text-muted">ไม่มีสินค้า</td></tr>
                        )}
                    </tbody>
                    </Table>
                </div>
              )}
            </Tab>

            {/* TAB 3: PENDING */}
            <Tab eventKey="pending" title={
              <span>⏳ รออนุมัติ {pendingDonations.length > 0 && <Badge bg="danger" pill>{pendingDonations.length}</Badge>}</span>
            }>
               <div className="table-responsive">
                    <Table hover className="align-middle text-nowrap">
                    <thead className="table-light">
                        <tr>
                        <th>วันที่</th>
                        <th>ผู้บริจาค</th>
                        <th>รายการ</th>
                        <th>จำนวน</th>
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
                            <td>
                            <Button size="sm" variant="outline-success" 
                                onClick={() => handleApprove(t._id, t.itemId?.name, t.quantity)}>
                                ✅ รับ
                            </Button>
                            </td>
                        </tr>
                        )) : (
                        <tr><td colSpan={5} className="text-center py-4 text-muted">ไม่มีรายการรออนุมัติ</td></tr>
                        )}
                    </tbody>
                    </Table>
               </div>
            </Tab>

            {/* TAB 4: HISTORY */}
            <Tab eventKey="history" title="📜 ประวัติ">
               <div className="table-responsive">
                    <Table hover className="align-middle small text-nowrap">
                    <thead className="table-light">
                        <tr>
                        <th>เวลา</th>
                        <th>ประเภท</th>
                        <th>รายการ</th>
                        <th>จำนวน</th>
                        <th>รายละเอียด</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyLogs.map(t => (
                        <tr key={t._id}>
                            <td>{formatDate(t.createdAt)}</td>
                            <td>
                            <Badge bg={t.type === 'IN' ? 'success' : 'warning'} text={t.type === 'OUT' ? 'dark' : 'white'}>
                                {t.type === 'IN' ? 'รับเข้า' : 'เบิกออก'}
                            </Badge>
                            </td>
                            <td>{t.itemId?.name}</td>
                            <td className="fw-bold">{t.quantity.toLocaleString()}</td>
                            <td>{t.type === 'IN' ? t.donorName : t.centerId?.name}</td>
                        </tr>
                        ))}
                    </tbody>
                    </Table>
               </div>
            </Tab>

          </Tabs>
        </Card.Body>
      </Card>

      <ReceiveModal show={showReceiveModal} onHide={() => setShowReceiveModal(false)} onSuccess={fetchData} />
      <DistributeModal show={showDistributeModal} onHide={() => setShowDistributeModal(false)} onSuccess={fetchData} />
      
      <CenterManagementModal 
        show={showCenterModal} 
        onHide={() => setShowCenterModal(false)} 
        onSuccess={fetchData} 
        editData={editingCenter} 
      />
    </Container>
  );
}