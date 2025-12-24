// src/app/admin/ReceiveModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Tabs, Tab, Table, InputGroup } from 'react-bootstrap';
import { Search, PlusCircle, BoxSeam } from 'react-bootstrap-icons';
import Swal from 'sweetalert2';

interface Props {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

export default function ReceiveModal({ show, onHide, onSuccess }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('existing');

  // Bulk State (For Existing Items)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [itemSearch, setItemSearch] = useState('');
  const [recorderName, setRecorderName] = useState(''); // State for recorder
  const [donorName, setDonorName] = useState('');

  // New Item State
  const [newItemData, setNewItemData] = useState({
    name: '', category: 'อาหารและน้ำดื่ม', quantity: 1, unit: 'แพ็ค', donorName: ''
  });

  useEffect(() => {
    if (show) {
      loadItems();
      loadUser();
      setSelectedItems({});
      setDonorName('');
      setItemSearch('');
      setActiveTab('existing');
    }
  }, [show]);

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (show) loadItems();
    }, 500);
    return () => clearTimeout(handler);
  }, [itemSearch]);

  const loadItems = async () => {
    try {
      const params = new URLSearchParams({
        limit: '20',
        search: itemSearch
      });
      const res = await fetch(`/api/items?${params}`);
      const data = await res.json();
      setItems(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user?.name) setRecorderName(data.user.name);
    } catch (e) { console.error(e); }
  };

  // Bulk Logic
  const toggleItem = (itemId: string) => {
    const newSel = { ...selectedItems };
    if (newSel[itemId]) delete newSel[itemId];
    else newSel[itemId] = 1;
    setSelectedItems(newSel);
  };

  const changeItemQty = (itemId: string, qty: number) => {
    if (qty < 1) qty = 1;
    setSelectedItems({ ...selectedItems, [itemId]: qty });
  };

  const handleBulkSubmit = async () => {
    if (Object.keys(selectedItems).length === 0) return;

    try {
      const payload = {
        items: Object.entries(selectedItems).map(([id, qty]) => ({ itemId: id, quantity: qty })),
        centerIds: [],
        requesterName: recorderName || 'Staff', // Use recorderName
        donorName: donorName,
        type: 'IN'
      };

      const res = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed');

      Swal.fire('สำเร็จ', 'บันทึกรับของเรียบร้อย', 'success');
      onSuccess();
      onHide();
    } catch (e) {
      Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
    }
  };

  // New Item Logic
  const handleNewItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create Item
      const resItem = await fetch('/api/items/create', {
        method: 'POST',
        body: JSON.stringify({
          name: newItemData.name,
          category: newItemData.category,
          unit: newItemData.unit,
          quantity: 0
        })
      });
      const newItem = await resItem.json();

      // 2. Create Transaction
      await fetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'IN',
          itemId: newItem._id,
          quantity: Number(newItemData.quantity),
          donorName: newItemData.donorName
        })
      });

      Swal.fire('สำเร็จ', 'เพิ่มสินค้าใหม่เรียบร้อย', 'success');
      onSuccess();
      onHide();
      setNewItemData({ name: '', category: 'อาหารและน้ำดื่ม', quantity: 1, unit: 'แพ็ค', donorName: '' });

    } catch (e) {
      Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error');
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="text-success">📥 รับบริจาค / เติมสต็อก</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)} className="mb-3">
          <Tab eventKey="existing" title="📦 เติมของเดิม (Bulk)">
            <div className="fade-in">
              <InputGroup className="mb-3">
                <InputGroup.Text><Search /></InputGroup.Text>
                <Form.Control placeholder="ค้นหาสิ่งของ..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} autoFocus />
              </InputGroup>

              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <Table hover size="sm" className="mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th style={{ width: '40px' }}>เลือก</th>
                      <th>ชื่อสินค้า</th>
                      <th style={{ width: '120px' }}>จำนวนที่รับ</th>
                      <th>หน่วย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const isSelected = !!selectedItems[item._id];
                      return (
                        <tr key={item._id} className={isSelected ? 'table-active' : ''}>
                          <td><Form.Check checked={isSelected} onChange={() => toggleItem(item._id)} /></td>
                          <td>{item.name} <small className="text-muted">(มีอยู่: {item.quantity})</small></td>
                          <td>
                            {isSelected && (
                              <Form.Control
                                size="sm" type="number" min={1}
                                value={selectedItems[item._id]}
                                onChange={e => changeItemQty(item._id, Number(e.target.value))}
                              />
                            )}
                          </td>
                          <td>{item.unit}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              <Row>
                <Col>
                  <Form.Group className="mt-3">
                    <Form.Label>ชื่อผู้บริจาค (ถ้ามี)</Form.Label>
                    <Form.Control
                      type="text"
                      value={donorName}
                      onChange={e => setDonorName(e.target.value)}
                      placeholder="ระบุชื่อผู้บริจาค..."
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mt-3">
                    <Form.Label>ผู้บันทึก / ผู้รับของ</Form.Label>
                    <Form.Control
                      type="text"
                      value={recorderName}
                      onChange={e => setRecorderName(e.target.value)}
                      placeholder="ระบุชื่อเจ้าหน้าที่..."
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </Tab>

          <Tab eventKey="new" title="✨ สินค้าใหม่ (New Item)">
            <Form onSubmit={handleNewItemSubmit}>
              <div className="p-2">
                <Form.Group className="mb-3">
                  <Form.Label>ชื่อสิ่งของ <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required type="text" placeholder="เช่น น้ำดื่มตราสิงห์, ปลากระป๋อง"
                    value={newItemData.name}
                    onChange={e => setNewItemData({ ...newItemData, name: e.target.value })}
                  />
                </Form.Group>
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>หมวดหมู่</Form.Label>
                      <Form.Select
                        value={newItemData.category}
                        onChange={e => setNewItemData({ ...newItemData, category: e.target.value })}
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
                        value={newItemData.unit}
                        onChange={e => setNewItemData({ ...newItemData, unit: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>จำนวนที่รับ</Form.Label>
                      <Form.Control
                        required type="number" min="1"
                        value={newItemData.quantity}
                        onChange={e => setNewItemData({ ...newItemData, quantity: Number(e.target.value) })}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>ชื่อผู้บริจาค</Form.Label>
                      <Form.Control
                        type="text"
                        value={newItemData.donorName}
                        onChange={e => setNewItemData({ ...newItemData, donorName: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="text-end">
                  <Button variant="success" type="submit"><PlusCircle /> สร้างและรับของ</Button>
                </div>
              </div>
            </Form>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        {activeTab === 'existing' && (
          <Button variant="success" onClick={handleBulkSubmit} disabled={Object.keys(selectedItems).length === 0}>
            ยืนยันการรับของ ({Object.keys(selectedItems).length})
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}