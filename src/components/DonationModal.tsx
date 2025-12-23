'use client';

import { useState } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap'; // เพิ่ม Spinner
import Swal from 'sweetalert2';
import { Center } from '@/types';

interface Props {
  show: boolean;
  onHide: () => void;
  center: Center;
}

export default function DonationModal({ show, onHide, center }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false); // กันกดย้ำ
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
    if (isSubmitting) return;

    // Validation เบื้องต้น
    if (!formData.donorName.trim() || !formData.contact.trim() || !formData.itemName.trim()) {
        Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
        return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'IN',
          status: 'PENDING',
          centerId: center._id,
          donorName: `${formData.donorName} (${formData.contact})`, // รวมชื่อและเบอร์
          itemName: formData.itemName,
          quantity: formData.quantity,
          unit: formData.unit,
          category: formData.category
        })
      });

      if (!res.ok) throw new Error('Failed');

      Swal.fire({
        title: 'บันทึกสำเร็จ! 💙',
        text: 'เจ้าหน้าที่จะตรวจสอบและอนุมัติรายการของท่านเร็วๆ นี้',
        icon: 'success',
        confirmButtonColor: '#0d6efd'
      });
      onHide();
      setFormData({ donorName: '', contact: '', itemName: '', quantity: 1, unit: 'แพ็ค', category: 'อาหารและน้ำดื่ม' });
    } catch (error) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถส่งข้อมูลได้ในขณะนี้', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static"> {/* backdrop static กันกดปิดมั่ว */}
      <Modal.Header closeButton>
        <Modal.Title>🎁 แจ้งบริจาคสิ่งของ</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="alert alert-info small mb-3">
            บริจาคให้: <strong>{center.name}</strong><br/>
            ระบบจะบันทึกสถานะเป็น "รอตรวจสอบ" จนกว่าของจะถึงมือเจ้าหน้าที่
          </div>

          <Row className="mb-3">
            <Col>
              <Form.Label>ชื่อผู้บริจาค <span className="text-danger">*</span></Form.Label>
              <Form.Control required placeholder="ชื่อ-นามสกุล" 
                value={formData.donorName} onChange={e => setFormData({...formData, donorName: e.target.value})} />
            </Col>
            <Col>
              <Form.Label>เบอร์ติดต่อ <span className="text-danger">*</span></Form.Label>
              <Form.Control required placeholder="08x-xxxxxxx" 
                value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
            </Col>
          </Row>

          <hr className="my-4" />

          <Form.Group className="mb-3">
            <Form.Label>สิ่งของที่บริจาค <span className="text-danger">*</span></Form.Label>
            <Form.Control required placeholder="เช่น น้ำดื่ม, ข้าวสาร, บะหมี่" 
              value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} />
          </Form.Group>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Label>หมวดหมู่</Form.Label>
              <Form.Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>อาหารและน้ำดื่ม</option>
                <option>ยาและเวชภัณฑ์</option>
                <option>เครื่องนุ่งห่ม</option>
                <option>ของใช้ทั่วไป</option>
                <option>อุปกรณ์การนอน</option>
              </Form.Select>
            </Col>
            <Col xs={3}>
              <Form.Label>จำนวน</Form.Label>
              <Form.Control type="number" min="1" required
                value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
            </Col>
            <Col xs={3}>
              <Form.Label>หน่วย</Form.Label>
              <Form.Control required placeholder="แพ็ค/ชิ้น"
                value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>ยกเลิก</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Spinner size="sm" animation="border"/> กำลังส่ง...</> : 'ยืนยันการบริจาค'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}