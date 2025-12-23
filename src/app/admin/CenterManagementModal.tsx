'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import Swal from 'sweetalert2';

interface Props {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  editData?: any; // ถ้ามีข้อมูลส่งมา = แก้ไข, ถ้าไม่มี = เพิ่มใหม่
}

export default function CenterManagementModal({ show, onHide, onSuccess, editData }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    subdistrict: '',
    phoneNumbers: '',
    capacity: 0,
    shelterType: 'ศูนย์พักพิงหลัก',
    status: 'active'
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        district: editData.district || '',
        subdistrict: editData.subdistrict || '',
        phoneNumbers: editData.phoneNumbers ? editData.phoneNumbers.join(',') : '',
        capacity: editData.capacity || 0,
        shelterType: editData.shelterType || 'ศูนย์พักพิงหลัก',
        status: editData.status || 'active'
      });
    } else {
      // Reset Form for Create mode
      setFormData({
        name: '', district: '', subdistrict: '', phoneNumbers: '',
        capacity: 0, shelterType: 'ศูนย์พักพิงหลัก', status: 'active'
      });
    }
  }, [editData, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      _id: editData?._id, // ส่ง ID ไปด้วยถ้าแก้ไข
      phoneNumbers: formData.phoneNumbers.split(',').map(p => p.trim()).filter(p => p)
    };

    const method = editData ? 'PUT' : 'POST';

    try {
      const res = await fetch('/api/centers/manage', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed');

      Swal.fire('สำเร็จ', `${editData ? 'แก้ไข' : 'เพิ่ม'}ข้อมูลศูนย์เรียบร้อย`, 'success');
      onSuccess();
      onHide();
    } catch (error) {
      Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{editData ? '✏️ แก้ไขข้อมูลศูนย์' : '🏥 เพิ่มศูนย์พักพิงใหม่'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={8}>
              <Form.Label>ชื่อศูนย์พักพิง <span className="text-danger">*</span></Form.Label>
              <Form.Control required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </Col>
            <Col md={4}>
              <Form.Label>ประเภท</Form.Label>
              <Form.Select value={formData.shelterType} onChange={e => setFormData({...formData, shelterType: e.target.value})}>
                <option>ศูนย์พักพิงหลัก</option>
                <option>จุดรองรับชั่วคราว</option>
                <option>บ้านญาติ</option>
              </Form.Select>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Label>อำเภอ</Form.Label>
              <Form.Control required value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
            </Col>
            <Col md={6}>
              <Form.Label>ตำบล</Form.Label>
              <Form.Control value={formData.subdistrict} onChange={e => setFormData({...formData, subdistrict: e.target.value})} />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Label>ความจุ (คน)</Form.Label>
              <Form.Control type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: Number(e.target.value)})} />
            </Col>
            <Col md={4}>
              <Form.Label>สถานะ</Form.Label>
              <Form.Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="active">เปิดใช้งาน (Active)</option>
                <option value="closed">ปิดชั่วคราว (Closed)</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label>เบอร์โทร (คั่นด้วยจุลภาค ,)</Form.Label>
              <Form.Control placeholder="081xxxx, 02xxxx" value={formData.phoneNumbers} onChange={e => setFormData({...formData, phoneNumbers: e.target.value})} />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>ยกเลิก</Button>
          <Button variant="primary" type="submit">บันทึกข้อมูล</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}