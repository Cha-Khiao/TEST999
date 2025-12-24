'use client';

import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Badge, Card, Spinner, Tabs, Tab, Form, InputGroup, Pagination } from 'react-bootstrap';
import { PencilSquare, Trash, PlusCircle, Search, FileEarmarkExcel } from 'react-bootstrap-icons';
import Swal from 'sweetalert2';
import CenterManagementModal from '../CenterManagementModal';

export default function LocationsPage() {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search State
  const [activeTab, setActiveTab] = useState('DONATION_POINT');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalItems, setTotalItems] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // ฟังก์ชันดึงข้อมูลตามหน้า (Pagination)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        const params = new URLSearchParams({
            type: activeTab,
            page: page.toString(),
            limit: '10',
            search: searchTerm
        });

        const res = await fetch(`/api/centers?${params.toString()}`);
        if (res.ok) {
            const result = await res.json();
            // เช็ค format ข้อมูลกันเหนียว
            if (result.data) {
                setCenters(result.data);
                setTotalPages(result.meta.totalPages);
                setTotalItems(result.meta.total);
            } else {
                setCenters([]);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }, [page, activeTab, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ฟังก์ชัน Export CSV (โหลดข้อมูลทั้งหมดของ Tab นั้นๆ ไม่สนหน้า)
  const handleExport = async () => {
    try {
        Swal.fire({ title: 'กำลังสร้างไฟล์...', didOpen: () => Swal.showLoading() });
        
        // ดึงข้อมูลทั้งหมด (limit เยอะๆ)
        const res = await fetch(`/api/centers?type=${activeTab}&limit=10000`);
        const result = await res.json();
        const allData = result.data || [];

        const headers = ["ชื่อสถานที่", "อำเภอ", "ตำบล", "ประเภท", "สถานะ", "ผู้รับผิดชอบ/ประเภทอาคาร", "เบอร์โทร", "พิกัด"];
        const csvRows = [
            headers.join(','),
            ...allData.map((c: any) => [
                `"${c.name}"`,
                `"${c.district}"`,
                `"${c.subdistrict || '-'}"`,
                `"${c.type}"`,
                `"${c.status}"`,
                `"${c.type === 'DONATION_POINT' ? (c.contactPerson || '-') : (c.shelterType || '-')}"`,
                `"${(c.phoneNumbers || []).join(' ')}"`,
                `"${c.location || '-'}"`
            ].join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${activeTab}_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Swal.close();
    } catch (error) {
        Swal.fire('Error', 'ไม่สามารถ Export ได้', 'error');
    }
  };

  const handleTabChange = (k: string | null) => {
    if (k) {
        setActiveTab(k);
        setPage(1);
        setSearchTerm('');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (await Swal.fire({ title: `ลบ ${name}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' }).then(r => r.isConfirmed)) {
        await fetch(`/api/centers/manage?id=${id}`, { method: 'DELETE' });
        fetchData();
        Swal.fire('ลบสำเร็จ', '', 'success');
    }
  };

  const handleEdit = (c: any) => { setEditData(c); setShowModal(true); };
  const handleAdd = () => { setEditData(null); setShowModal(true); };

  return (
    <div className="fade-in">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
         <div>
            <h3 className="fw-bold mb-1">🏥 จัดการสถานที่</h3>
            <p className="text-muted mb-0">บริหารจัดการจุดรับบริจาคและศูนย์อพยพ</p>
         </div>
         <div className="d-flex gap-2">
             <Button variant="outline-success" onClick={handleExport} className="d-flex align-items-center gap-2 shadow-sm">
                <FileEarmarkExcel /> Export CSV
             </Button>
             <Button variant="primary" className="d-flex align-items-center gap-2 shadow-sm" onClick={handleAdd}>
                <PlusCircle /> เพิ่มสถานที่ใหม่
             </Button>
         </div>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body>
            <Tabs activeKey={activeTab} onSelect={handleTabChange} className="mb-3">
                <Tab eventKey="DONATION_POINT" title="📦 จุดรับบริจาค" />
                <Tab eventKey="SHELTER" title="🛡️ ศูนย์อพยพ" />
            </Tabs>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="text-muted small">
                    พบทั้งหมด <strong>{totalItems}</strong> รายการ
                </div>
                <Form onSubmit={handleSearch} className="d-flex gap-2" style={{maxWidth: '300px'}}>
                    <InputGroup>
                        <InputGroup.Text><Search /></InputGroup.Text>
                        <Form.Control 
                            placeholder="ค้นหาชื่อ หรือ อำเภอ..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </Form>
            </div>

            {loading ? <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div> : (
                <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4">ชื่อสถานที่</th>
                                <th>อำเภอ</th>
                                <th>{activeTab === 'DONATION_POINT' ? 'ผู้รับผิดชอบ' : 'ประเภทอาคาร'}</th>
                                <th>สถานะ</th>
                                <th className="text-end pe-4">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {centers.length > 0 ? centers.map(c => (
                                <tr key={c._id}>
                                    <td className="fw-bold ps-4 text-primary">{c.name}</td>
                                    <td>{c.district}</td>
                                    <td>
                                        <small className="text-muted">
                                            {activeTab === 'DONATION_POINT' ? (c.contactPerson || '-') : (c.shelterType || '-')}
                                        </small>
                                    </td>
                                    <td>
                                        <Badge bg={c.status === 'active' ? 'success' : 'secondary'}>
                                            {c.status === 'active' ? 'ใช้งาน' : 'ปิด'}
                                        </Badge>
                                    </td>
                                    <td className="text-end pe-4">
                                        <Button size="sm" variant="light" className="text-primary me-1" onClick={() => handleEdit(c)}><PencilSquare /></Button>
                                        <Button size="sm" variant="light" className="text-danger" onClick={() => handleDelete(c._id, c.name)}><Trash /></Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center py-5 text-muted">ไม่พบข้อมูล</td></tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                        <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                        <Pagination.Prev onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
                        <Pagination.Item active>{page}</Pagination.Item>
                        <Pagination.Next onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
                        <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
                    </Pagination>
                </div>
            )}
        </Card.Body>
      </Card>

      <CenterManagementModal show={showModal} onHide={() => setShowModal(false)} onSuccess={fetchData} editData={editData} />
    </div>
  );
}