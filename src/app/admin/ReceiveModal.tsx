// src/app/admin/ReceiveModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import Swal from 'sweetalert2';

interface Props {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

// รายการสินค้าที่มีอยู่แล้ว (สำหรับทำ Auto-complete ในอนาคต) 
// แต่เบื้องต้นเราให้พิมพ์เองหรือเลือกจากที่มีอยู่ก็ได้
export default function ReceiveModal({ show, onHide, onSuccess }: Props) {
  const [items, setItems] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    itemId: '', // ถ้าเป็นการเติมของเดิม
    name: '', // ถ้าเป็นของใหม่
    category: 'อาหารและน้ำดื่ม',
    quantity: 1,
    unit: 'แพ็ค',
    donorName: ''
  });
  
  const [isNewItem, setIsNewItem] = useState(true);

  // ดึงรายการสินค้าเดิมมาแสดงใน Dropdown
  useEffect(() => {
    if (show) {
      fetch('/api/items')
        .then(res => res.json())
        .then(data => setItems(data));
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // เตรียมข้อมูลส่ง API
    // ถ้าเป็นของใหม่ เราต้องสร้าง Item ใหม่ก่อน หรือให้ API จัดการ (ในที่นี้เราจะส่งไปให้ API Transactions จัดการ)
    // แต่เพื่อความง่าย เราจะส่ง logic ไปรวมกันที่ API Transactions ที่เราสร้างไว้ตอนแรก
    // ต้องปรับ API Transactions นิดหน่อยให้รองรับการสร้าง Item ใหม่ หรือเราจะทำแบบง่ายคือ
    // "ถ้าเลือก Existing Item ส่ง itemId, ถ้าเลือก New Item ส่งชื่อไปสร้างใหม่"
    
    // *หมายเหตุ* เพื่อความง่ายในขั้นตอน "ทำไปทีละส่วน" 
    // เราจะใช้ Logic: ถ้าเป็น New Item ให้สร้าง Item ก่อน แล้วค่อย Transaction
    // หรือปรับ API ให้ฉลาดขึ้น แต่ตอนนี้ขอใช้วิธี: **สร้าง Transaction แบบรับเข้า (IN)**
    
    try {
        // Logic การรับเข้า: 
        // 1. ถ้าเลือกของเดิม -> ส่ง itemId
        // 2. ถ้าของใหม่ -> ต้องยิง API สร้าง Item ก่อน (หรือให้ API handle)
        // เพื่อไม่ให้ซับซ้อน เราจะทำแบบง่าย: ให้ User เลือกของเดิมที่มี หรือ กรอกชื่อใหม่
        // ถ้ากรอกชื่อใหม่ เราจะยิง API สร้าง Item ใหม่ก่อน
        
        let targetItemId = formData.itemId;

        if (isNewItem) {
             const resItem = await fetch('/api/items/create', { // เดี๋ยวสร้าง API นี้เพิ่ม
                method: 'POST',
                body: JSON.stringify({
                    name: formData.name,
                    category: formData.category,
                    unit: formData.unit,
                    quantity: 0 // เริ่มต้น 0 แล้วค่อยบวก transaction
                })
             });
             const newItem = await resItem.json();
             targetItemId = newItem._id;
        }

        // สร้าง Transaction รับเข้า
        const resTrans = await fetch('/api/transactions', {
            method: 'POST',
            body: JSON.stringify({
                type: 'IN',
                itemId: targetItemId,
                quantity: Number(formData.quantity),
                donorName: formData.donorName
            })
        });

        if (!resTrans.ok) throw new Error('Transaction failed');

        Swal.fire('สำเร็จ', 'บันทึกการรับบริจาคเรียบร้อย', 'success');
        onSuccess(); // รีเฟรชตาราง
        onHide(); // ปิด Modal
        
        // Reset Form
        setFormData({ itemId: '', name: '', category: 'อาหารและน้ำดื่ม', quantity: 1, unit: 'แพ็ค', donorName: '' });
        setIsNewItem(true);

    } catch (error) {
        Swal.fire('Error', 'เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>📥 รับบริจาคสิ่งของ</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>ประเภทการรับ</Form.Label>
            <div>
                <Form.Check 
                    inline type="radio" label="สินค้าใหม่ (New Item)" 
                    name="type" checked={isNewItem} onChange={() => setIsNewItem(true)} 
                />
                <Form.Check 
                    inline type="radio" label="เติมสต็อกเดิม (Existing)" 
                    name="type" checked={!isNewItem} onChange={() => setIsNewItem(false)} 
                />
            </div>
          </Form.Group>

          {isNewItem ? (
             <>
                <Form.Group className="mb-3">
                    <Form.Label>ชื่อสิ่งของ <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                        required type="text" placeholder="เช่น น้ำดื่ม, ข้าวสาร" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </Form.Group>
                <Row>
                    <Col>
                        <Form.Group className="mb-3">
                            <Form.Label>หมวดหมู่</Form.Label>
                            <Form.Select 
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option>อาหารและน้ำดื่ม</option>
                                <option>ยาและเวชภัณฑ์</option>
                                <option>เครื่องนุ่งห่ม</option>
                                <option>ของใช้ทั่วไป</option>
                                <option>อุปกรณ์การนอน</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group className="mb-3">
                            <Form.Label>หน่วยนับ</Form.Label>
                            <Form.Control 
                                required type="text" placeholder="เช่น แพ็ค, ขวด" 
                                value={formData.unit}
                                onChange={e => setFormData({...formData, unit: e.target.value})}
                            />
                        </Form.Group>
                    </Col>
                </Row>
             </>
          ) : (
             <Form.Group className="mb-3">
                <Form.Label>เลือกสินค้าจากคลัง</Form.Label>
                <Form.Select 
                    required 
                    value={formData.itemId}
                    onChange={e => {
                        const item = items.find(i => i._id === e.target.value);
                        setFormData({...formData, itemId: e.target.value, unit: item?.unit || ''});
                    }}
                >
                    <option value="">-- เลือกรายการ --</option>
                    {items.map(i => (
                        <option key={i._id} value={i._id}>{i.name} (คงเหลือ: {i.quantity} {i.unit})</option>
                    ))}
                </Form.Select>
             </Form.Group>
          )}

          <Row>
            <Col>
                 <Form.Group className="mb-3">
                    <Form.Label>จำนวนที่รับ</Form.Label>
                    <Form.Control 
                        required type="number" min="1"
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                    />
                 </Form.Group>
            </Col>
            <Col>
                <Form.Group className="mb-3">
                   <Form.Label>หน่วยนับ</Form.Label>
                   <Form.Control type="text" value={formData.unit} disabled={!isNewItem} readOnly />
                </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>ชื่อผู้บริจาค (Optional)</Form.Label>
            <Form.Control 
                type="text" placeholder="ระบุชื่อผู้บริจาค..."
                value={formData.donorName}
                onChange={e => setFormData({...formData, donorName: e.target.value})}
            />
          </Form.Group>

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>ยกเลิก</Button>
          <Button variant="success" type="submit">บันทึกรับของ</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}