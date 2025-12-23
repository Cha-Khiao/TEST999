// src/app/admin/DistributeModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import Swal from 'sweetalert2';

interface Props {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

export default function DistributeModal({ show, onHide, onSuccess }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    itemId: '',
    centerId: '',
    quantity: 1,
    requesterName: ''
  });

  const [selectedItem, setSelectedItem] = useState<any>(null);

  // โหลดข้อมูลสินค้า และ รายชื่อศูนย์ เมื่อเปิด Modal
  useEffect(() => {
    if (show) {
      // โหลดสินค้า
      fetch('/api/items')
        .then(res => res.json())
        .then(data => setItems(data.filter((i: any) => i.quantity > 0))); // เอาเฉพาะที่มีของ

      // โหลดศูนย์อพยพ
      fetch('/api/centers')
        .then(res => res.json())
        .then(data => setCenters(data));
    }
  }, [show]);

  // เมื่อเลือกสินค้า ให้เก็บข้อมูลสินค้านั้นไว้เพื่อเช็คสต็อก
  const handleItemChange = (itemId: string) => {
    const item = items.find(i => i._id === itemId);
    setSelectedItem(item);
    setFormData({ ...formData, itemId, quantity: 1 }); // รีเซ็ตจำนวนเป็น 1 เสมอ
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem || formData.quantity > selectedItem.quantity) {
      Swal.fire('ข้อผิดพลาด', 'จำนวนที่เบิกเกินกว่าที่มีในสต็อก', 'error');
      return;
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OUT', // ระบุว่าเป็นขาออก
          itemId: formData.itemId,
          centerId: formData.centerId,
          quantity: formData.quantity,
          requesterName: formData.requesterName
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }

      Swal.fire('สำเร็จ', 'บันทึกการเบิกจ่ายเรียบร้อย', 'success');
      onSuccess();
      onHide();
      setFormData({ itemId: '', centerId: '', quantity: 1, requesterName: '' });
      setSelectedItem(null);

    } catch (error) {
      Swal.fire('Error', 'เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">📤 เบิกจ่ายสิ่งของ</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* เลือกสินค้า */}
          <Form.Group className="mb-3">
            <Form.Label>เลือกสิ่งของที่จะเบิก</Form.Label>
            <Form.Select 
              required 
              value={formData.itemId}
              onChange={(e) => handleItemChange(e.target.value)}
            >
              <option value="">-- เลือกรายการ --</option>
              {items.map(i => (
                <option key={i._id} value={i._id}>
                  {i.name} (คงเหลือ: {i.quantity} {i.unit})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* แสดงแจ้งเตือนสต็อก */}
          {selectedItem && (
            <Alert variant="info" className="py-2 mb-3 small">
              📦 สินค้า: <strong>{selectedItem.name}</strong> | 
              คงเหลือสูงสุด: <strong>{selectedItem.quantity} {selectedItem.unit}</strong>
            </Alert>
          )}

          {/* เลือกศูนย์ปลายทาง */}
          <Form.Group className="mb-3">
            <Form.Label>ส่งไปยังศูนย์อพยพ</Form.Label>
            <Form.Select 
              required 
              value={formData.centerId}
              onChange={(e) => setFormData({...formData, centerId: e.target.value})}
            >
              <option value="">-- เลือกศูนย์ปลายทาง --</option>
              {centers.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.district})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>จำนวนที่เบิก</Form.Label>
                <Form.Control 
                  required type="number" min="1" 
                  max={selectedItem?.quantity || 999999}
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                />
              </Form.Group>
            </Col>
            <Col>
               <Form.Group className="mb-3">
                <Form.Label>ผู้เบิก (เจ้าหน้าที่)</Form.Label>
                <Form.Control 
                  type="text" required placeholder="ชื่อผู้ทำรายการ"
                  value={formData.requesterName}
                  onChange={(e) => setFormData({...formData, requesterName: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>ยกเลิก</Button>
          <Button variant="danger" type="submit">ยืนยันการเบิกจ่าย</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}