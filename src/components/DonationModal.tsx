'use client';

import { useState } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap'; // เพิ่ม Spinner
import Swal from 'sweetalert2';
import { Center } from '@/types';
import { isValidThaiPhoneNumber, formatPhoneNumberInput } from '@/utils/validation';

interface Props {
  show: boolean;
  onHide: () => void;
  center: Center;
}

export default function DonationModal({ show, onHide, center }: Props) {
  const [items, setItems] = useState<any[]>([]); // List of items to donate
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    donorName: '',
    contact: '',
    isPickupRequired: false,
    pickupLocation: '',
    proofUrl: ''
  });

  const [currentItem, setCurrentItem] = useState({
    itemName: '',
    quantity: 1,
    unit: 'แพ็ค',
    category: 'อาหารและน้ำดื่ม'
  });

  const addItem = () => {
    if (!currentItem.itemName.trim()) {
      Swal.fire('แจ้งเตือน', 'กรุณาระบุชื่อสิ่งของ', 'warning');
      return;
    }
    setItems([...items, { ...currentItem, id: Date.now() }]); // Add logic ID
    setCurrentItem({ itemName: '', quantity: 1, unit: 'แพ็ค', category: 'อาหารและน้ำดื่ม' }); // Reset form
  };

  const removeItem = (id: number) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (items.length === 0) {
      Swal.fire('เตือน', 'กรุณาเพิ่มรายการสิ่งของอย่างน้อย 1 รายการ', 'warning');
      return;
    }
    // Validation เบื้องต้น
    if (!formData.donorName.trim() || !formData.contact.trim()) {
      Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลผู้บริจาคให้ครบถ้วน', 'warning');
      return;
    }

    if (!isValidThaiPhoneNumber(formData.contact)) {
      Swal.fire('แจ้งเตือน', 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)', 'warning');
      return;
    }

    if (formData.isPickupRequired && !formData.proofUrl) {
      Swal.fire('แจ้งเตือน', 'กรุณาแนบรูปภาพของที่จะบริจาค (สำหรับการไปรับ)', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: 'IN',
        status: 'PENDING',
        centerIds: [center._id], // Use centerIds array for bulk
        donorName: formData.donorName,
        contactPhone: formData.contact,
        isPickupRequired: formData.isPickupRequired,
        pickupLocation: formData.pickupLocation,
        proofUrl: formData.proofUrl,
        items: items.map(i => ({
          itemName: i.itemName,
          quantity: i.quantity,
          unit: i.unit,
          category: i.category
        }))
      };

      const res = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed');

      Swal.fire({
        title: 'บันทึกสำเร็จ! 💙',
        text: 'เจ้าหน้าที่จะตรวจสอบและอนุมัติรายการของท่านเร็วๆ นี้',
        icon: 'success',
        confirmButtonColor: '#0d6efd'
      });
      onHide();
      // Reset All
      setItems([]);
      setFormData({
        donorName: '', contact: '', isPickupRequired: false, pickupLocation: '', proofUrl: ''
      });
    } catch (error) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถส่งข้อมูลได้ในขณะนี้', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title>🎁 แจ้งบริจาคสิ่งของ</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="alert alert-info small mb-3">
          บริจาคให้: <strong>{center.name}</strong><br />
          ระบบจะบันทึกสถานะเป็น "รอตรวจสอบ" จนกว่าของจะถึงมือเจ้าหน้าที่
        </div>

        <Row className="mb-3">
          <Col>
            <Form.Label>ชื่อผู้บริจาค <span className="text-danger">*</span></Form.Label>
            <Form.Control required placeholder="ชื่อ-นามสกุล"
              value={formData.donorName} onChange={e => setFormData({ ...formData, donorName: e.target.value })} />
          </Col>
          <Col>
            <Form.Label>เบอร์ติดต่อ <span className="text-danger">*</span></Form.Label>
            <Form.Control required placeholder="08x-xxxxxxx"
              value={formData.contact}
              onChange={e => setFormData({ ...formData, contact: formatPhoneNumberInput(e.target.value) })}
              maxLength={10}
            />
          </Col>
        </Row>

        <Form.Group className="mb-3 bg-light p-3 rounded border">
          <Form.Check
            type="checkbox"
            label="ต้องการให้เจ้าหน้าที่ไปรับของ (นอกสถานที่)"
            checked={formData.isPickupRequired}
            onChange={e => setFormData({ ...formData, isPickupRequired: e.target.checked })}
            className="mb-2 fw-bold text-primary"
          />
          {formData.isPickupRequired && (
            <>
              <Form.Control
                placeholder="ระบุสถานที่รับของ / ปักหมุด Google Maps"
                value={formData.pickupLocation}
                onChange={e => setFormData({ ...formData, pickupLocation: e.target.value })}
                required={formData.isPickupRequired}
              />
              <div className="mt-2">
                <Form.Label className="small">รูปภาพของที่จะให้ไปรับ (แนบไฟล์รูป) <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="file"
                  size="sm"
                  accept="image/*"
                  onChange={(e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        Swal.fire('ขนาดไฟล์เกิน', 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB', 'warning');
                        e.target.value = null;
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, proofUrl: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {formData.proofUrl && <div className="mt-1 small text-success">แนบรูปเรียบร้อยแล้ว</div>}
              </div>
            </>
          )}
        </Form.Group>

        <hr className="my-4" />
        <h5 className="fw-bold mb-3">📦 รายการสิ่งของ</h5>

        <div className="card p-3 bg-light border-0 mb-3">
          <Row className="g-2 items-end">
            <Col md={5}>
              <Form.Label className="small">สิ่งของ</Form.Label>
              <Form.Control
                placeholder="เช่น น้ำดื่ม, ข้าวสาร"
                value={currentItem.itemName}
                onChange={e => setCurrentItem({ ...currentItem, itemName: e.target.value })}
              />
            </Col>
            <Col md={3}>
              <Form.Label className="small">หมวดหมู่</Form.Label>
              <Form.Select
                value={currentItem.category}
                onChange={e => setCurrentItem({ ...currentItem, category: e.target.value })}
              >
                <option>อาหารและน้ำดื่ม</option>
                <option>ยาและเวชภัณฑ์</option>
                <option>เครื่องนุ่งห่ม</option>
                <option>ของใช้ทั่วไป</option>
                <option>อุปกรณ์การนอน</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={2}>
              <Form.Label className="small">จำนวน</Form.Label>
              <Form.Control
                type="number" min="1"
                value={currentItem.quantity}
                onChange={e => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
              />
            </Col>
            <Col xs={6} md={2}>
              <Form.Label className="small">หน่วย</Form.Label>
              <Form.Control
                placeholder="หน่วย"
                value={currentItem.unit}
                onChange={e => setCurrentItem({ ...currentItem, unit: e.target.value })}
              />
            </Col>
            <Col xs={12} className="text-end mt-2">
              <Button variant="outline-primary" size="sm" onClick={addItem}>+ เพิ่มรายการ</Button>
            </Col>
          </Row>
        </div>

        {/* List of added items */}
        {items.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>รายการ</th>
                  <th>หมวดหมู่</th>
                  <th>จำนวน</th>
                  <th>ลบ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.itemName}</td>
                    <td>{i.category}</td>
                    <td>{i.quantity} {i.unit}</td>
                    <td className="text-center" style={{ width: '50px' }}>
                      <button type="button" className="btn btn-link text-danger p-0" onClick={() => removeItem(i.id)}>
                        <i className="bi bi-x-circle-fill"></i> ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-muted py-3 border rounded border-dashed">
            ยังไม่มีรายการที่เพิ่ม
          </div>
        )}

      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || items.length === 0}>
          {isSubmitting ? <><Spinner size="sm" animation="border" /> กำลังส่ง...</> : `ยืนยันการบริจาค (${items.length} รายการ)`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}