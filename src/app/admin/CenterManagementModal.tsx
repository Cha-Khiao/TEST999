'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { isValidThaiPhoneNumber } from '@/utils/validation';

interface Props {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  editData?: any;
}

export default function CenterManagementModal({ show, onHide, onSuccess, editData }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    subdistrict: '',
    phoneNumbers: '',
    capacity: 0,
    shelterType: 'ศูนย์พักพิงหลัก',
    status: 'active',
    contactPerson: '',
    type: 'SHELTER' // ค่าเริ่มต้น
  });

  useEffect(() => {
    if (editData) {
      // โหลดข้อมูลเดิมมาใส่ฟอร์ม
      setFormData({
        name: editData.name || '',
        district: editData.district || '',
        subdistrict: editData.subdistrict || '',
        phoneNumbers: editData.phoneNumbers ? editData.phoneNumbers.join(',') : '',
        capacity: editData.capacity || 0,
        shelterType: editData.shelterType || 'ศูนย์พักพิงหลัก',
        status: editData.status || 'active',
        contactPerson: editData.contactPerson || '',
        // ถ้าไม่มี type ให้ default เป็น SHELTER
        type: editData.type || 'SHELTER'
      });
    } else {
      // เคลียร์ฟอร์มสำหรับเพิ่มใหม่
      setFormData({
        name: '', district: '', subdistrict: '', phoneNumbers: '',
        capacity: 0, shelterType: 'ศูนย์พักพิงหลัก', status: 'active',
        contactPerson: '', type: 'SHELTER'
      });
    }
  }, [editData, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Debug ดูค่าก่อนส่ง (กด F12 ดู console ได้เลย)
    // Debug ดูค่าก่อนส่ง (กด F12 ดู console ได้เลย)
    console.log("Submitting Data:", formData);

    const phones = formData.phoneNumbers.split(',').map((p: string) => p.trim()).filter((p: string) => p);

    // Validate Phones
    for (const p of phones) {
      if (!isValidThaiPhoneNumber(p)) {
        Swal.fire('ข้อมูลไม่ถูกต้อง', `เบอร์โทรศัพท์ "${p}" ไม่ถูกต้อง (ต้องเป็นตัวเลข 10 หลัก)`, 'warning');
        return;
      }
    }

    const payload = {
      ...formData,
      _id: editData?._id,
      phoneNumbers: phones
    };

    const method = editData ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/centers/manage', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed');

      Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
      onSuccess(); // สั่งให้หน้าหลักโหลดข้อมูลใหม่
      onHide();
    } catch (error) {
      Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{editData ? '✏️ แก้ไขข้อมูล' : '🏥 เพิ่มสถานที่ใหม่'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* ส่วนเลือกประเภท (สำคัญมาก) */}
          <Alert variant={formData.type === 'DONATION_POINT' ? 'info' : 'primary'} className="mb-4">
            <p className="mb-2 fw-bold">📍 ประเภทสถานที่:</p>
            <div className="d-flex gap-3">
              <Form.Check
                type="radio"
                id="type_donation"
                label="กล่องรับบริจาค (DONATION POINT)"
                name="centerType"
                checked={formData.type === 'DONATION_POINT'}
                onChange={() => setFormData(prev => ({ ...prev, type: 'DONATION_POINT' }))}
              />
              <Form.Check
                type="radio"
                id="type_shelter"
                label="ศูนย์อพยพ/ที่พัก (SHELTER)"
                name="centerType"
                checked={formData.type === 'SHELTER'}
                onChange={() => setFormData(prev => ({ ...prev, type: 'SHELTER' }))}
              />
            </div>
            <small className="text-muted d-block mt-2">
              * เลือก "กล่องรับบริจาค" เพื่อให้ประชาชนเห็นในหน้าแรก
            </small>
          </Alert>

          <Row className="mb-3">
            <Col md={8}>
              <Form.Label>ชื่อสถานที่</Form.Label>
              <Form.Control required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </Col>
            <Col md={4}>
              <Form.Label>ผู้รับผิดชอบ</Form.Label>
              <Form.Control value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="เช่น ครูใหญ่" />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Label>อำเภอ</Form.Label>
              <Form.Control required value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} />
            </Col>
            <Col md={6}>
              <Form.Label>ตำบล</Form.Label>
              <Form.Control value={formData.subdistrict} onChange={e => setFormData({ ...formData, subdistrict: e.target.value })} />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Label>ประเภทอาคาร</Form.Label>
              <Form.Select value={formData.shelterType} onChange={e => setFormData({ ...formData, shelterType: e.target.value })}>
                <option>ศูนย์พักพิงหลัก</option>
                <option>อาคารราชการ</option>
                <option>โรงเรียน</option>
                <option>วัด/ศาสนสถาน</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>สถานะ</Form.Label>
              <Form.Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="active">ใช้งาน</option>
                <option value="closed">ปิด</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>ความจุ</Form.Label>
              <Form.Control type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} />
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>เบอร์โทร (คั่นด้วย ,)</Form.Label>
            <Form.Control value={formData.phoneNumbers} onChange={e => setFormData({ ...formData, phoneNumbers: e.target.value })} />
          </Form.Group>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>ยกเลิก</Button>
          <Button variant="primary" type="submit">บันทึกข้อมูล</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}