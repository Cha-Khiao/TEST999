'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, InputGroup, Table, Badge, ProgressBar, Card } from 'react-bootstrap';
import { Search, BoxSeam, GeoAlt, CheckCircle } from 'react-bootstrap-icons';
import Swal from 'sweetalert2';

interface Props {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

export default function DistributeModal({ show, onHide, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Selection State
  // items: { 'itemId': quantity } -> if key exists, it is selected
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  // centers: ['centerId1', 'centerId2']
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);

  const [requesterName, setRequesterName] = useState('');

  // Search State
  const [itemSearch, setItemSearch] = useState('');

  const [centerSearch, setCenterSearch] = useState('');

  // Pending & Proof
  const [isPending, setIsPending] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  // Debounced Item Search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (show) loadItems();
    }, 500);
    return () => clearTimeout(handler);
  }, [itemSearch, show]); // Add show dependency to trigger initial load

  // Initial Load (User & Centers)
  useEffect(() => {
    if (show) {
      setStep(1);
      setSelectedItems({});
      setSelectedCenters([]);
      setRequesterName('');
      setIsPending(false);
      setProofUrl('');
      setItemSearch('');
      loadUserAndCenters();
    }
  }, [show]);

  const loadItems = async () => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        search: itemSearch
      });
      const res = await fetch(`/api/items?${params}`);
      const data = await res.json();
      // Server already filters quantity > 0 usually, but let's be safe if API changes
      setItems((data.data || []).filter((i: any) => i.quantity > 0));
    } catch (e) { console.error(e); }
  };

  const loadUserAndCenters = async () => {
    try {
      // Load User & Centers
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      setUser(userData.user);
      if (userData.user?.name) setRequesterName(userData.user.name);

      const centerRes = await fetch('/api/centers?all=true');
      const centerData = await centerRes.json();
      const allCenters = centerData.data || [];

      if (userData.user?.authorizedCenterId) {
        setCenters(allCenters.filter((c: any) => c._id === userData.user.authorizedCenterId));
        setSelectedCenters([userData.user.authorizedCenterId]);
      } else {
        setCenters(allCenters.filter((c: any) => c.type === 'SHELTER'));
      }
    } catch (e) { console.error(e); }
  };

  // Step 1: Item Logic
  const toggleItem = (itemId: string, maxQty: number) => {
    const newSel = { ...selectedItems };
    if (newSel[itemId]) {
      delete newSel[itemId];
    } else {
      newSel[itemId] = 1; // Default qty
    }
    setSelectedItems(newSel);
  };

  const changeItemQty = (itemId: string, qty: number, max: number) => {
    if (qty < 1) qty = 1;
    // Note: We check total stock availability at Confirm step (because multiplied by centers)
    // But for UI UX, we can limit per-unit here if we want, but keeping it flexible is better
    setSelectedItems({ ...selectedItems, [itemId]: qty });
  };

  // Step 2: Center Logic
  const toggleCenter = (centerId: string) => {
    if (user?.authorizedCenterId) return; // Locked for staff

    const newSel = [...selectedCenters];
    if (newSel.includes(centerId)) {
      setSelectedCenters(newSel.filter(id => id !== centerId));
    } else {
      newSel.push(centerId);
    }
    setSelectedCenters(newSel);
  };

  const toggleAllCenters = () => {
    const filtered = centers.filter(c => c.name.includes(centerSearch) || c.district.includes(centerSearch));
    if (selectedCenters.length === filtered.length) {
      setSelectedCenters([]);
    } else {
      setSelectedCenters(filtered.map(c => c._id));
    }
  };

  // Submit
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        items: Object.entries(selectedItems).map(([id, qty]) => ({ itemId: id, quantity: qty })),
        centerIds: selectedCenters,
        requesterName,
        type: 'OUT',
        status: isPending ? 'PENDING' : 'COMPLETED',
        proofUrl: proofUrl
      };


      const res = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      Swal.fire('สำเร็จ', `${isPending ? 'ส่งคำขออนุมัติแล้ว' : 'เบิกจ่ายเรียบร้อย'} (ทั้งหมด ${result.count} รายการ)`, 'success');
      onSuccess();
      onHide();
    } catch (e: any) {
      Swal.fire('เกิดข้อผิดพลาด', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Renders
  const renderStep1 = () => (
    <div className="fade-in">
      <InputGroup className="mb-3">
        <InputGroup.Text><Search /></InputGroup.Text>
        <Form.Control placeholder="ค้นหาสิ่งของ..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
      </InputGroup>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <Table hover size="sm">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>เลือก</th>
              <th>ชื่อสินค้า</th>
              <th style={{ width: '100px' }}>คงเหลือ</th>
              <th style={{ width: '100px' }}>จำนวนเบิก/แห่ง</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const isSelected = !!selectedItems[item._id];
              return (
                <tr key={item._id} className={isSelected ? 'table-active' : ''}>
                  <td>
                    <Form.Check checked={isSelected} onChange={() => toggleItem(item._id, item.quantity)} />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>
                    {isSelected && (
                      <Form.Control
                        size="sm" type="number" min={1}
                        value={selectedItems[item._id]}
                        onChange={(e) => changeItemQty(item._id, Number(e.target.value), item.quantity)}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <div className="mt-3 text-end text-muted small">
        เลือกแล้ว {Object.keys(selectedItems).length} รายการ
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="fade-in">
      {!user?.authorizedCenterId && (
        <div className="d-flex gap-2 mb-3">
          <InputGroup>
            <InputGroup.Text><Search /></InputGroup.Text>
            <Form.Control placeholder="ค้นหาศูนย์ หรือ อำเภอ..." value={centerSearch} onChange={e => setCenterSearch(e.target.value)} />
          </InputGroup>
          <Button variant="outline-secondary" onClick={toggleAllCenters}>เลือกทั้งหมด</Button>
        </div>
      )}

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {centers.filter(c => c.name.includes(centerSearch) || c.district.includes(centerSearch)).map(center => {
          const isSel = selectedCenters.includes(center._id);
          return (
            <Card
              key={center._id}
              className={`mb-2 cursor-pointer ${isSel ? 'border-primary bg-primary-subtle' : ''}`}
              onClick={() => toggleCenter(center._id)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body className="p-2 d-flex align-items-center gap-3">
                <Form.Check checked={isSel} readOnly />
                <div>
                  <div className="fw-bold">{center.name}</div>
                  <div className="small text-muted">อำเภอ{center.district} | {center.shelterType || 'จุดพักพิงชั่วคราว'}</div>
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>
      <div className="mt-3 text-end text-muted small">
        เลือกแล้ว {selectedCenters.length} แห่ง
      </div>
    </div>
  );

  const renderStep3 = () => {
    const totalCenters = selectedCenters.length;
    const itemList = Object.entries(selectedItems).map(([id, qty]) => {
      const item = items.find(i => i._id === id);
      return { ...item, qtyPerCenter: qty, totalQty: qty * totalCenters };
    });

    return (
      <div className="fade-in">
        <Alert variant="warning" className="d-flex align-items-center gap-2">
          <CheckCircle size={24} />
          <div>
            ตรวจสอบรายการก่อนยืนยัน <br />
            <small>คุณกำลังจะส่งของไปยัง <strong>{totalCenters}</strong> สถานที่</small>
          </div>
        </Alert>

        <Table striped bordered size="sm">
          <thead><tr className="table-secondary"><th>รายการ</th><th className="text-end">ต่อแห่ง</th><th className="text-end">รวมทั้งหมดต้องใช้</th></tr></thead>
          <tbody>
            {itemList.map(i => (
              <tr key={i._id}>
                <td>{i.name}</td>
                <td className="text-end">{i.qtyPerCenter} {i.unit}</td>
                <td className={`text-end fw-bold ${i.totalQty > i.quantity ? 'text-danger' : ''}`}>
                  {i.totalQty} {i.unit}
                  {i.totalQty > i.quantity && <div className="small text-danger">(ของไม่พอ!)</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Form.Group>
          <Form.Label>ผู้ดำเนินการ</Form.Label>
        </Form.Group>

        <div className="mt-4 p-3 bg-body-tertiary rounded border">
          <Form.Check
            type="switch"
            id="pending-switch"
            label="ส่งเรื่องขออนุมัติ (ยังไม่ตัดสต็อกทันที)"
            checked={isPending}
            onChange={(e) => setIsPending(e.target.checked)}
            className="mb-3 fw-bold"
          />

          {isPending && (
            <Form.Group>
              <Form.Label>ภาพหลักฐาน / ใบเบิก (URL)</Form.Label>
              <Form.Control
                value={proofUrl}
                onChange={e => setProofUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <Form.Text className="text-muted">ใส่ลิงก์รูปภาพเอกสารอ้างอิงถ้ามี</Form.Text>
            </Form.Group>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          📤 เบิกจ่ายแบบเหมา (Bulk)
          <Badge bg="secondary">Step {step}/3</Badge>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ProgressBar now={(step / 3) * 100} className="mb-4" style={{ height: '5px' }} />

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

      </Modal.Body>
      <Modal.Footer>
        {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={loading}>ย้อนกลับ</Button>}

        {step < 3 ? (
          <Button
            variant="primary"
            onClick={() => setStep(step + 1)}
            disabled={(step === 1 && Object.keys(selectedItems).length === 0) || (step === 2 && selectedCenters.length === 0)}
          >
            ถัดไป
          </Button>
        ) : (
          <Button variant={isPending ? 'warning' : 'success'} onClick={handleSubmit} disabled={loading}>
            {loading ? 'กำลังบันทึก...' : (isPending ? 'ส่งคำขออนุมัติ' : 'ยืนยันการเบิกจ่าย')}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}