'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { Center } from '@/types';
import { isValidThaiPhoneNumber, formatPhoneNumberInput } from '@/utils/validation';

interface Props {
    show: boolean;
    onHide: () => void;
}

export default function RequisitionModal({ show, onHide }: Props) {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [centers, setCenters] = useState<any[]>([]);
    const [requesterName, setRequesterName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [centerId, setCenterId] = useState('');
    const [proofUrl, setProofUrl] = useState('');
    const [validated, setValidated] = useState(false);

    // PICKUP = Select Source (Stock Check), DELIVERY = No Source (Global Stock)
    const [fulfillmentType, setFulfillmentType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');

    // Multi-select state: Map<itemId, quantity>
    const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (show) {
            fetchCenters();
            // Reset items when modal opens
            setItems([]);
            setSelectedItems(new Map());
            setCenterId('');
            setFulfillmentType('PICKUP');
            setSearchTerm('');
            // fetchItems('', ''); // Removed: Wait for user to select center (if PICKUP)
        }
    }, [show]);

    // Fetch items logic (Debounced Search)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (!show) return;

            if (fulfillmentType === 'PICKUP') {
                if (!centerId) {
                    setItems([]);
                    return;
                }
                fetchItems(centerId, searchTerm);
            } else {
                // DELIVERY -> Global Stock (Fetch all items, ignore centerId)
                fetchItems('', searchTerm);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, centerId, fulfillmentType, show]); // Added show dependency for robustness

    const fetchItems = async (cId?: string, search?: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                limit: '50', // Increase limit slightly to ensure we get enough > 0 items
                search: search || ''
            });

            if (cId) params.append('centerId', cId);

            const res = await fetch(`/api/items?${params.toString()}`);
            const data = await res.json();

            // Client-side filter for now to ensure 0 qty are hidden
            // (API filters global stock > 0, but for specific center stock might be 0)
            const availableItems = (data.data || []).filter((i: any) => i.quantity > 0);

            setItems(availableItems);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCenters = async () => {
        try {
            const res = await fetch('/api/centers?limit=100&type=DONATION_POINT');
            const data = await res.json();
            setCenters(data.data || []);
        } catch (error) { console.error(error); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleItemToggle = (itemId: string, checked: boolean) => {
        const newSelected = new Map(selectedItems);
        if (checked) {
            newSelected.set(itemId, 1);
        } else {
            newSelected.delete(itemId);
        }
        setSelectedItems(newSelected);
    };

    const handleQuantityChange = (itemId: string, qty: number) => {
        if (qty < 1) return;
        const newSelected = new Map(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.set(itemId, qty);
        }
        setSelectedItems(newSelected);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        if (!requesterName.trim() || !contactPhone.trim()) {
            Swal.fire('แจ้งเตือน', 'กรุณาระบุชื่อผู้เบิกและเบอร์ติดต่อ', 'warning');
            return;
        }

        if (!isValidThaiPhoneNumber(contactPhone)) {
            Swal.fire('แจ้งเตือน', 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)', 'warning');
            return;
        }

        // Validate Center only if PICKUP
        if (fulfillmentType === 'PICKUP' && !centerId) {
            Swal.fire('ข้อมูลไม่ครบ', 'กรุณาเลือกจุดรับบริจาคต้นทาง', 'warning');
            return;
        }

        if (selectedItems.size === 0) {
            Swal.fire('ข้อมูลไม่ครบ', 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ', 'warning');
            return;
        }

        setLoading(true);
        try {
            // Transform selectedItems map to array for API
            const itemsPayload = Array.from(selectedItems.entries()).map(([itemId, quantity]) => ({
                itemId,
                quantity
            }));

            const res = await fetch('/api/transactions/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'OUT',
                    status: 'PENDING',
                    centerIds: centerId ? [centerId] : [], // Empty if DELIVERY
                    items: itemsPayload,
                    requesterName: requesterName,
                    contactPhone: contactPhone,
                    proofUrl: proofUrl
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to submit request');
            }

            Swal.fire({
                icon: 'success',
                title: 'ส่งคำขอเบิกสำเร็จ',
                text: 'เจ้าหน้าที่จะตรวจสอบและอนุมัติโดยเร็วที่สุด',
                confirmButtonColor: '#198754'
            });

            // Reset Form
            setRequesterName('');
            setContactPhone('');
            setCenterId('');
            setProofUrl('');
            setSelectedItems(new Map());
            setValidated(false);
            onHide();

        } catch (error: any) {
            Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
            <Modal.Header closeButton>
                <Modal.Title>📋 เบิกสิ่งของ (สำหรับเจ้าหน้าที่)</Modal.Title>
            </Modal.Header>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Modal.Body>
                    <Alert variant="info" className="small mb-3">
                        <i className="bi bi-info-circle me-1"></i>
                        กรุณากระบุข้อมูลเจ้าหน้าที่และเลือกรายการที่ต้องการเบิก
                    </Alert>

                    <div className="d-flex gap-3 mb-4 p-3 border rounded bg-body-tertiary">
                        <Form.Check
                            type="radio"
                            id="fulfill-pickup"
                            label="📍 มารับของเอง (Self Pickup)"
                            name="fulfillmentType"
                            checked={fulfillmentType === 'PICKUP'}
                            onChange={() => setFulfillmentType('PICKUP')}
                            className="mb-0 fw-bold"
                        />
                        <Form.Check
                            type="radio"
                            id="fulfill-delivery"
                            label="🚚 ขอรับการจัดส่ง/สนับสนุน (Request Support)"
                            name="fulfillmentType"
                            checked={fulfillmentType === 'DELIVERY'}
                            onChange={() => setFulfillmentType('DELIVERY')}
                            className="mb-0 fw-bold"
                        />
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label>ชื่อ-นามสกุล (ผู้เบิก) <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            required
                            type="text"
                            placeholder="ระบุชื่อจริง"
                            value={requesterName}
                            onChange={e => setRequesterName(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>เบอร์ติดต่อ <span className="text-danger">*</span></Form.Label>
                        <Form.Control required placeholder="08x-xxxxxxx"
                            value={contactPhone}
                            onChange={e => setContactPhone(formatPhoneNumberInput(e.target.value))}
                            maxLength={10}
                        />
                    </Form.Group>

                    {fulfillmentType === 'PICKUP' ? (
                        <Form.Group className="mb-3">
                            <Form.Label>ต้องการเบิกจากจุดไหน? (Source) <span className="text-danger">*</span></Form.Label>
                            <Form.Select
                                required
                                value={centerId}
                                onChange={e => setCenterId(e.target.value)}
                            >
                                <option value="">-- เลือกจุดรับบริจาคต้นทาง --</option>
                                {centers.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-muted">เลือกจุดที่คุณต้องการนำของออกมา</Form.Text>
                        </Form.Group>
                    ) : (
                        <Alert variant="secondary" className="small">
                            <i className="bi bi-truck me-2"></i>
                            ระบบจะตรวจสอบสต๊อกรวมจากทุกจุด (Global Stock) และเจ้าหน้าที่จะติดต่อกลับเพื่อนัดหมายการส่งมอบ
                        </Alert>
                    )}

                    <hr className="my-4 op-10" />

                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <Form.Label className="mb-0 fw-bold">เลือกรายการสินค้าที่ต้องการเบิก <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            size="sm"
                            type="search"
                            placeholder="🔍 ค้นหาสินค้า..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ maxWidth: '200px' }}
                        />
                    </div>

                    {fulfillmentType === 'PICKUP' && !centerId && (
                        <Alert variant="warning" className="small">กรุณาเลือก "จุดรับบริจาคต้นทาง" ก่อนเลือกสินค้า</Alert>
                    )}

                    <div className={`border rounded p-3 ${fulfillmentType === 'PICKUP' && !centerId ? 'bg-light' : 'bg-body'}`} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {loading && <div className="text-center text-muted small py-2">กำลังโหลด...</div>}

                        {!loading && items.length === 0 && (
                            <p className="text-center text-muted">
                                {fulfillmentType === 'PICKUP' && !centerId ? 'รอการเลือกจุดรับ...' : 'ไม่พบสินค้า'}
                            </p>
                        )}
                        {items.map(i => {
                            // Disabled if 0 quantity
                            const isDisabled = i.quantity <= 0;
                            const isSelected = selectedItems.has(i._id);
                            return (
                                <div key={i._id} className={`d-flex align-items-center justify-content-between mb-2 p-2 border-bottom ${isDisabled ? 'text-muted opacity-50' : ''} ${isSelected ? 'bg-primary-subtle rounded' : ''}`}>
                                    <Form.Check
                                        type="checkbox"
                                        id={`item-${i._id}`}
                                        label={
                                            <span className={isDisabled ? 'text-decoration-line-through' : ''}>
                                                {i.name} <small className="text-muted">({i.quantity} {i.unit})</small>
                                            </span>
                                        }
                                        checked={isSelected}
                                        disabled={isDisabled}
                                        onChange={(e) => handleItemToggle(i._id, e.target.checked)}
                                        className="mb-0 flex-grow-1"
                                    />
                                    {isSelected && (
                                        <div style={{ width: '120px' }}>
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                min={1}
                                                // max={i.quantity} // Allow requesting more? Logic says "Pendng allows negative/validation optional".
                                                value={selectedItems.get(i._id)}
                                                onChange={(e) => handleQuantityChange(i._id, Number(e.target.value))}
                                                placeholder="จำนวน"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {selectedItems.size === 0 && validated && (
                        <div className="text-danger small mt-1">กรุณาเลือกสินค้าอย่างน้อย 1 รายการ</div>
                    )}

                    <Form.Group className="mb-3 mt-4">
                        <Form.Label>รูปถ่ายบัตร/เอกสารยืนยัน (ถ้ามี)</Form.Label>
                        <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </Form.Group>

                    {proofUrl && (
                        <div className="mb-3 text-center">
                            <img src={proofUrl} alt="Preview" className="img-thumbnail" style={{ maxHeight: '150px' }} />
                        </div>
                    )}

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="warning" type="submit" disabled={loading}>
                        {loading ? <Spinner animation="border" size="sm" /> : `ยืนยันการเบิก (${selectedItems.size} รายการ)`}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
