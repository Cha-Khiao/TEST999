'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Badge, Card, Spinner, Tabs, Tab, Form, InputGroup, Pagination, Modal, Row, Col } from 'react-bootstrap';
import { BoxArrowInDown, BoxArrowUp, FileEarmarkExcel, Search, Filter, Pencil, Trash } from 'react-bootstrap-icons';
import { getCategoryColor } from '@/utils/ui-helpers';
import Swal from 'sweetalert2';
import ReceiveModal from '../ReceiveModal';
import DistributeModal from '../DistributeModal';

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReceive, setShowReceive] = useState(false);
    const [showDistribute, setShowDistribute] = useState(false);
    const [activeTab, setActiveTab] = useState('stock');

    // Filter & Pagination State
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [stockPage, setStockPage] = useState(1);
    const [stockMeta, setStockMeta] = useState<any>({});

    const [historyPage, setHistoryPage] = useState(1);
    const [historyMeta, setHistoryMeta] = useState<any>({});

    // History Filters
    const [histSearch, setHistSearch] = useState('');
    const [histType, setHistType] = useState('All');
    const [histMonth, setHistMonth] = useState('');
    const [histYear, setHistYear] = useState('');


    const [showEdit, setShowEdit] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        fetchStock();
    }, [stockPage, search, category]);

    useEffect(() => {
        fetchHistory();
    }, [historyPage, histType, histMonth, histYear]); // Trigger on filter change (Debounce search separately?)

    const [debouncedSearch, setDebouncedSearch] = useState(histSearch);
    useEffect(() => {
        const handler = setTimeout(() => { fetchHistory(); }, 500);
        return () => clearTimeout(handler);
    }, [histSearch]);

    const fetchStock = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: stockPage.toString(),
                limit: '10',
                category: category !== 'All' ? category : '',
                search: search
            });
            const res = await fetch(`/api/items?${params}`);
            const data = await res.json();
            setItems(data.data || []);
            setStockMeta(data.meta || {});
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchHistory = async () => {
        try {
            const params = new URLSearchParams({
                page: historyPage.toString(),
                limit: '15',
                search: histSearch,
                type: histType !== 'All' ? histType : '',
                month: histMonth,
                year: histYear
            });
            const res = await fetch(`/api/transactions?${params}`);
            const data = await res.json();
            setHistory(data.data || []);
            setHistoryMeta(data.meta || {});
        } catch (e) { console.error(e); }
    };

    const refreshAll = () => {
        fetchStock();
        fetchHistory();
    };

    const handleDelete = async (id: string, name: string) => {
        const result = await Swal.fire({
            title: `ลบสินค้า "${name}"?`,
            text: "การลบจะไม่สามารถกู้คืนได้ (แต่ประวัติเดิมจะยังอยู่)",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'ลบเลย'
        });

        if (result.isConfirmed) {
            await fetch(`/api/items/${id}`, { method: 'DELETE' });
            fetchStock();
            Swal.fire('ลบแล้ว', '', 'success');
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch(`/api/items/${editingItem._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: editingItem.name,
                category: editingItem.category,
                unit: editingItem.unit
            })
        });
        setShowEdit(false);
        fetchStock();
        Swal.fire('บันทึกสำเร็จ', '', 'success');
    };

    const renderPagination = (meta: any, setPage: any) => {
        if (!meta.totalPages || meta.totalPages <= 1) return null;
        let items = [];
        for (let number = 1; number <= meta.totalPages; number++) {
            items.push(
                <Pagination.Item key={number} active={number === meta.page} onClick={() => setPage(number)}>
                    {number}
                </Pagination.Item>,
            );
        }
        return <Pagination>{items}</Pagination>;
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', {
        day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    const handleExport = () => {
        Swal.fire('Export', 'ฟีเจอร์ Export จะรองรับการกรองช่วงวันในอนาคตครับ', 'info');
    };

    return (
        <div className="fade-in">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-1">📦 คลังสินค้า & เบิกจ่าย</h3>
                    <p className="text-muted mb-0">จัดการสต็อกสินค้าและประวัติการทำรายการ</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-success" onClick={handleExport} className="d-flex align-items-center gap-2 shadow-sm">
                        <FileEarmarkExcel /> Export CSV
                    </Button>
                    <Button variant="success" onClick={() => setShowReceive(true)} className="d-flex align-items-center gap-2 shadow-sm">
                        <BoxArrowInDown /> รับของเข้า
                    </Button>
                    <Button variant="warning" onClick={() => setShowDistribute(true)} className="d-flex align-items-center gap-2 shadow-sm">
                        <BoxArrowUp /> เบิกจ่ายออก
                    </Button>
                </div>
            </div>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'stock')} className="mb-3 px-3 pt-3 border-bottom-0">
                        <Tab eventKey="stock" title="📦 สินค้าคงเหลือ (Stock)">
                            <div className="px-3 pb-3">
                                <Row className="g-2 mb-3">
                                    <Col md={4}>
                                        <InputGroup>
                                            <InputGroup.Text><Search /></InputGroup.Text>
                                            <Form.Control
                                                placeholder="ค้นหาชื่อสินค้า..."
                                                value={search} onChange={e => setSearch(e.target.value)}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col md={3}>
                                        <Form.Select value={category} onChange={e => setCategory(e.target.value)}>
                                            <option value="All">-- ทุกหมวดหมู่ --</option>
                                            <option>อาหารและน้ำดื่ม</option>
                                            <option>ยาและเวชภัณฑ์</option>
                                            <option>เครื่องนุ่งห่ม</option>
                                            <option>ของใช้ทั่วไป</option>
                                            <option>อุปกรณ์การนอน</option>
                                        </Form.Select>
                                    </Col>
                                </Row>

                                <div className="table-responsive">
                                    {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
                                    {!loading && (
                                        <Table hover className="align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th className="ps-4">ชื่อสินค้า</th>
                                                    <th>หมวดหมู่</th>
                                                    <th className="text-end">คงเหลือ</th>
                                                    <th className="text-center">หน่วย</th>
                                                    <th className="text-end pe-4">จัดการ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length > 0 ? items.map(i => (
                                                    <tr key={i._id}>
                                                        <td className="fw-bold ps-4">{i.name}</td>
                                                        <td>
                                                            <Badge bg={getCategoryColor(i.category)} className="fw-normal">
                                                                {i.category}
                                                            </Badge>
                                                        </td>
                                                        <td className={`text-end fw-bold ${i.quantity < 10 ? 'text-danger' : 'text-success'}`}>{i.quantity.toLocaleString()}</td>
                                                        <td className="text-center text-muted">{i.unit}</td>
                                                        <td className="text-end pe-4">
                                                            <Button variant="link" size="sm" className="text-primary p-0 me-2" onClick={() => { setEditingItem(i); setShowEdit(true); }}>
                                                                <Pencil />
                                                            </Button>
                                                            <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDelete(i._id, i.name)}>
                                                                <Trash />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr><td colSpan={5} className="text-center py-5 text-muted">ไม่พบสินค้า</td></tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    )}
                                </div>
                                <div className="d-flex justify-content-center mt-3">
                                    {renderPagination(stockMeta, setStockPage)}
                                </div>
                            </div>
                        </Tab>

                        <Tab eventKey="history" title="📜 ประวัติการทำรายการ">
                            <div className="px-3 pb-3">
                                {/* -- Filter Row -- */}
                                <Row className="g-2 mb-3">
                                    <Col md={3}>
                                        <InputGroup>
                                            <InputGroup.Text><Search /></InputGroup.Text>
                                            <Form.Control
                                                placeholder="ค้นหา (ผู้ให้/ผู้เบิก/Admin)"
                                                value={histSearch} onChange={e => setHistSearch(e.target.value)}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Select value={histType} onChange={e => { setHistType(e.target.value); setHistoryPage(1); }}>
                                            <option value="All">ทุกประเภท</option>
                                            <option value="IN">รับเข้า (IN)</option>
                                            <option value="OUT">เบิกออก (OUT)</option>
                                        </Form.Select>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Select value={histMonth} onChange={e => { setHistMonth(e.target.value); setHistoryPage(1); }}>
                                            <option value="">ทุกเดือน</option>
                                            {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map((m, i) => (
                                                <option key={i} value={i + 1}>{m}</option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Select value={histYear} onChange={e => { setHistYear(e.target.value); setHistoryPage(1); }}>
                                            <option value="">ทุกปี</option>
                                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                                <option key={y} value={y}>{y + 543}</option>
                                            ))}
                                        </Form.Select>
                                    </Col>
                                </Row>

                                <div className="table-responsive" style={{ minHeight: '400px' }}>
                                    <Table hover className="align-middle small mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-4">เวลา</th>
                                                <th>ประเภท</th>
                                                <th>รายการ</th>
                                                <th>จำนวน</th>
                                                <th>รายละเอียด (ผู้ให้/ผู้รับ)</th>
                                                <th className="pe-4">ผู้ทำรายการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.length > 0 ? history.map(t => (
                                                <tr key={t._id}>
                                                    <td className="ps-4 text-muted">{formatDate(t.createdAt)}</td>
                                                    <td>
                                                        <Badge bg={t.type === 'IN' ? 'success' : 'warning'} text={t.type === 'OUT' ? 'dark' : 'white'}>
                                                            {t.type === 'IN' ? 'รับเข้า' : 'เบิกออก'}
                                                        </Badge>
                                                    </td>
                                                    <td>{t.itemId?.name || '-'}</td>
                                                    <td className="fw-bold">{t.quantity.toLocaleString()}</td>
                                                    <td className="text-truncate" style={{ maxWidth: '200px' }}>
                                                        {t.type === 'IN' ? (
                                                            <div>
                                                                <div className="fw-bold text-success">{t.donorName || 'ไม่ระบุผู้บริจาค'}</div>
                                                                {t.contactPhone && <small className="text-muted"><i className="bi bi-telephone-fill me-1"></i>{t.contactPhone}</small>}
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className="fw-bold text-primary">{t.requesterName}</div>
                                                                <div className="small text-muted">
                                                                    {t.centerId ? `📍 ${t.centerId.name}` : `🚚 จัดส่ง (Delivery)`}
                                                                </div>
                                                                {t.contactPhone && <small className="text-muted d-block"><i className="bi bi-telephone-fill me-1"></i>{t.contactPhone}</small>}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="pe-4 text-muted">
                                                        {t.type === 'IN' ? (
                                                            // For IN: requesterName is the Recorder (Staff)
                                                            <span title="ผู้รับของ">{t.requesterName || 'Admin'}</span>
                                                        ) : (
                                                            // For OUT: approverName is the Admin who approved
                                                            <span title="ผู้อนุมัติ">{t.approverName || (t.status === 'COMPLETED' ? 'Admin' : 'รออนุมัติ')}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={6} className="text-center py-5 text-muted">ไม่มีประวัติรายการ</td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="d-flex justify-content-center mt-3">
                                    {renderPagination(historyMeta, setHistoryPage)}
                                </div>
                            </div>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            <ReceiveModal show={showReceive} onHide={() => setShowReceive(false)} onSuccess={refreshAll} />
            <DistributeModal show={showDistribute} onHide={() => setShowDistribute(false)} onSuccess={refreshAll} />

            {/* Edit Modal */}
            <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>✏️ แก้ไขข้อมูลสินค้า</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        {editingItem && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>ชื่อสินค้า</Form.Label>
                                    <Form.Control type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} required />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>หมวดหมู่</Form.Label>
                                    <Form.Select value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}>
                                        <option>อาหารและน้ำดื่ม</option>
                                        <option>ยาและเวชภัณฑ์</option>
                                        <option>เครื่องนุ่งห่ม</option>
                                        <option>ของใช้ทั่วไป</option>
                                        <option>อุปกรณ์การนอน</option>
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>หน่วยนับ</Form.Label>
                                    <Form.Control type="text" value={editingItem.unit} onChange={e => setEditingItem({ ...editingItem, unit: e.target.value })} required />
                                </Form.Group>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEdit(false)}>ยกเลิก</Button>
                        <Button variant="primary" type="submit">บันทึกการแก้ไข</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

        </div>
    );
}