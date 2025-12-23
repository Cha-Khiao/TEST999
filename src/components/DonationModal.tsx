// src/components/DonationModal.tsx
'use client';

import { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { Center } from '@/types';

interface Props {
  show: boolean;
  onHide: () => void;
  center: Center;
}

export default function DonationModal({ show, onHide, center }: Props) {
  const [formData, setFormData] = useState({
    donorName: '',
    contact: '',
    itemName: '',
    quantity: 1,
    unit: 'แพ็ค',
    category: 'อาหารและน้ำดื่ม'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ใช้ API Transactions โดยส่งสถานะ PENDING ไป
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'IN',
          status: 'PENDING', // สำคัญ: รอ Admin อนุมัติ
          centerId: center._id, // ระบุว่าบริจาคให้ศูนย์ไหน
          donorName: `${formData.donorName} (${formData.contact})`,
          itemName: formData.itemName, // เราจะส่งชื่อไปฝากไว้ในหมายเหตุหรือ field พิเศษ (ในที่นี้ขอประยุกต์ใช้ Model เดิม)
          // *หมายเหตุ: เพื่อความสมบูรณ์ เราควรปรับ API ให้รับ itemName สำหรับเคส PENDING ได้
          // แต่เพื่อความด่วน เราจะใช้ trick ส่ง itemName ไปในรายการ transaction ชั่วคราว
          quantity: formData.quantity,
          unit: formData.unit,
          category: formData.category
        })
      });

      if (!res.ok) throw new Error('Failed');

      Swal.fire({
        title: 'ขอบคุณสำหรับน้ำใจ! 💙',
        text: 'ข้อมูลการบริจาคถูกส่งไปยังเจ้าหน้าที่แล้ว กรุณานำสิ่งของไปส่งมอบตามที่อยู่ศูนย์',
        icon: 'success',
        confirmButtonColor: '#0d6efd'
      });
      onHide();
      setFormData({ donorName: '', contact: '', itemName: '', quantity: 1, unit: 'แพ็ค', category: 'อาหารและน้ำดื่ม' });
    } catch (error) {
      Swal.fire('Error', 'เกิดข้อผิดพลาด โปรดลองใหม่', 'error');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>🎁 แจ้งบริจาคสิ่งของ</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <p className="text-muted small mb-3">
            บริจาคให้: <strong>{center.name}</strong><br/>
            <span className="text-danger">* นี่เป็นการแจ้งล่วงหน้า กรุณานำของไปส่งที่ศูนย์จริงเพื่อให้เจ้าหน้าที่กดยืนยัน</span>
          </p>

          <Row className="mb-3">
            <Col>
              <Form.Label>ชื่อผู้บริจาค</Form.Label>
              <Form.Control required placeholder="คุณใจดี..." 
                value={formData.donorName} onChange={e => setFormData({...formData, donorName: e.target.value})} />
            </Col>
            <Col>
              <Form.Label>เบอร์ติดต่อ</Form.Label>
              <Form.Control required placeholder="08x-xxxxxxx" 
                value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
            </Col>
          </Row>

          <hr className="my-4" />

          <Form.Group className="mb-3">
            <Form.Label>สิ่งของที่บริจาค</Form.Label>
            <Form.Control required placeholder="เช่น น้ำดื่ม, ข้าวสาร, บะหมี่" 
              value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} />
          </Form.Group>

          <Row className="mb-3">
            <Col>
              <Form.Label>หมวดหมู่</Form.Label>
              <Form.Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>อาหารและน้ำดื่ม</option>
                <option>ยาและเวชภัณฑ์</option>
                <option>เครื่องนุ่งห่ม</option>
                <option>ของใช้ทั่วไป</option>
              </Form.Select>
            </Col>
            <Col xs={3}>
              <Form.Label>จำนวน</Form.Label>
              <Form.Control type="number" min="1" required
                value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
            </Col>
            <Col xs={3}>
              <Form.Label>หน่วย</Form.Label>
              <Form.Control required placeholder="แพ็ค"
                value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>ยกเลิก</Button>
          <Button variant="primary" type="submit">ยืนยันการบริจาค</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}