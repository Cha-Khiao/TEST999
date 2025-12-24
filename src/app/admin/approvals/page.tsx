'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Badge, Card, Spinner, Tabs, Tab, Modal, Form } from 'react-bootstrap';
import { CheckCircleFill, XCircleFill, Eye, GeoAltFill, TelephoneFill } from 'react-bootstrap-icons';
import { getCategoryColor } from '@/utils/ui-helpers';
import Swal from 'sweetalert2';

export default function ApprovalsPage() {
  const [inPending, setInPending] = useState<any[]>([]);
  const [outPending, setOutPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approverName, setApproverName] = useState('Admin'); // Default

  useEffect(() => {
    // Get Admin Name from Cookie
    const nameMatch = document.cookie.match(new RegExp('(^| )user_name=([^;]+)'));
    if (nameMatch) {
      const decoded = decodeURIComponent(nameMatch[2]);
      console.log('--- FOUND COOKIE USERNAME: ', decoded);
      setApproverName(decoded);
    } else {
      console.log('--- NO COOKIE USERNAME FOUND ---');
    }
  }, []);

  // Modal States
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofUrl, setProofUrl] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<any>(null);

  // Receipt Modal (For Incoming Donations)
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptTarget, setReceiptTarget] = useState<any>(null);
  const [receiptQty, setReceiptQty] = useState(0);
  const [receiptProof, setReceiptProof] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resIn, resOut] = await Promise.all([
        fetch('/api/transactions?status=PENDING&type=IN&limit=500').then(r => r.json()),
        fetch('/api/transactions?status=PENDING&type=OUT&limit=500').then(r => r.json())
      ]);
      setInPending(resIn.data || []);
      setOutPending(resOut.data || []);
      console.log('--- DEBUG APPROVALS PAGE ---');
      console.log('Incoming Pending:', resIn.data);
    } catch (error) {
      console.error("Fetch Data Error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- OUTGOING APPROVAL ---
  const handleApproveOut = async (t: any) => {
    const result = await Swal.fire({
      title: 'ยืนยันการอนุมัติ?',
      text: `อนุมัติการเบิก ${t.itemId?.name} จำนวน ${t.quantity} ไปยัง ${t.centerId?.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      confirmButtonColor: '#198754'
    });

    if (result.isConfirmed) {
      await executeUpdate(t._id, { status: 'COMPLETED' });
    }
  };

  // --- INCOMING RECEIPT ---
  const openReceiptModal = (t: any) => {
    setReceiptTarget(t);
    setReceiptQty(t.quantity);
    setReceiptProof('');
    setShowReceiptModal(true);
  };

  const handleReceiptSubmit = async () => {
    if (!receiptTarget) return;
    await executeUpdate(receiptTarget._id, {
      status: 'COMPLETED',
      quantity: receiptQty,
      proofUrl: receiptProof
    });
    setShowReceiptModal(false);
  };

  // --- SHARED UTILS ---
  const executeUpdate = async (id: string, body: any, silent: boolean = false) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, approverName }) // แนบชื่อผู้อนุมัติไปด้วย
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }

      if (!silent) {
        Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
        fetchData();
      }
    } catch (err: any) {
      if (!silent) Swal.fire('ผิดพลาด', err.message, 'error');
      else throw err; // Re-throw if silent so batch loop knows
    }
  };

  // --- REJECTION LOGIC ---
  const openRejectModal = (target: any | any[]) => {
    setRejectTarget(target);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return;

    const targets = Array.isArray(rejectTarget) ? rejectTarget : [rejectTarget];

    try {
      for (const t of targets) {
        await executeUpdate(t._id, {
          status: 'CANCELLED',
          rejectionReason: rejectReason
        }, true); // Silent update for batch
      }

      Swal.fire('สำเร็จ', 'บันทึกการปฏิเสธเรียบร้อย', 'success');
      setShowRejectModal(false);
      fetchData();
    } catch (err: any) {
      Swal.fire('ผิดพลาด', err.message, 'error');
    }
  };

  const openProof = (url: string) => {
    setProofUrl(url);
    setShowProofModal(true);
  };

  // Helper to count unique batches
  const countBatches = (items: any[], type: 'IN' | 'OUT') => {
    const groups = new Set();
    items.forEach(t => {
      const key = type === 'IN'
        ? t.groupId || `${t.donorName}-${t.contactPhone}-${new Date(t.createdAt).setSeconds(0, 0)}`
        : t.groupId || `${t.requesterName}-${t.contactPhone}-${new Date(t.createdAt).setSeconds(0, 0)}`;
      groups.add(key);
    });
    return groups.size;
  };

  const inBatchCount = countBatches(inPending, 'IN');
  const outBatchCount = countBatches(outPending, 'OUT');

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold">⏳ รายการรออนุมัติ</h2>
        <p className="text-muted">ตรวจสอบและอนุมัติรายการบริจาคและเบิกจ่าย</p>
      </div>

      <Card className="shadow-sm border-0">
        <Card.Body>
          {loading ? <Spinner animation="border" className="d-block mx-auto my-5" /> : (
            <Tabs defaultActiveKey="donations" id="approval-tabs" className="mb-3">
              {/* --- Donation Tab --- */}
              <Tab eventKey="donations" title={`📥 รับบริจาค (${inBatchCount})`}>
                <div className="mt-3">
                  {(() => {
                    const groupedIn = inPending.reduce((acc: any, t: any) => {
                      const gid = t.groupId || `${t.donorName}-${t.contactPhone}-${new Date(t.createdAt).setSeconds(0, 0)}`;
                      if (!acc[gid]) acc[gid] = { items: [], meta: t };
                      acc[gid].items.push(t);
                      return acc;
                    }, {});

                    const groups = Object.values(groupedIn);

                    if (groups.length === 0) return <div className="text-center py-5 text-muted">ไม่มีรายการค้างอนุมัติ</div>;

                    return groups.map((g: any, idx: number) => {
                      const { meta, items } = g;

                      return (
                        <Card key={idx} className="mb-3 border-0 shadow-sm">
                          <Card.Header className="bg-body border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-3">
                              <Badge bg="success" className="p-2">
                                {meta.isPickupRequired ? '🚚 ไปรับของ (Pickup)' : '📦 นำมาส่งเอง (Drop-off)'}
                              </Badge>
                              {meta.pickupLocation && (
                                <a
                                  href={meta.pickupLocation.startsWith('http') ? meta.pickupLocation : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meta.pickupLocation)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="small text-primary text-decoration-none border px-2 py-1 rounded bg-white"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GeoAltFill className="me-1" /> {meta.pickupLocation.startsWith('http') ? 'เปิดแผนที่ (Map Link)' : meta.pickupLocation}
                                </a>
                              )}
                            </div>
                            <div className="text-end small text-muted">
                              {new Date(meta.createdAt).toLocaleString('th-TH')}
                            </div>
                          </Card.Header>
                          <Card.Body>
                            <div className="row g-3 mb-3">
                              <div className="col-md-6">
                                <strong className="d-block text-secondary small">ผู้บริจาค</strong>
                                <div className="fw-bold fs-5">{meta.donorName}</div>
                                {meta.contactPhone && <div className="small text-muted"><TelephoneFill className="me-1" />{meta.contactPhone}</div>}
                              </div>
                              <div className="col-md-6 d-flex align-items-center justify-content-md-end gap-2">
                                {meta.proofUrl && (
                                  <Button size="sm" variant="outline-info" onClick={() => openProof(meta.proofUrl)}>
                                    <Eye className="me-1" /> ดูรูปของ
                                  </Button>
                                )}
                                <Button size="sm" variant="outline-danger" onClick={() => openRejectModal(items)}>
                                  <XCircleFill className="me-1" /> ปฏิเสธทั้งหมด
                                </Button>
                                <Button size="sm" variant="success" onClick={() => {
                                  Swal.fire({
                                    title: 'รับของทั้งหมด?',
                                    text: `ยืนยันรับเข้าสต็อกรวม ${items.length} รายการ?`,
                                    icon: 'question',
                                    showCancelButton: true,
                                    confirmButtonText: 'ยืนยันรับของ',
                                    confirmButtonColor: '#198754'
                                  }).then(async (r) => {
                                    if (r.isConfirmed) {
                                      for (const item of items) {
                                        await executeUpdate(item._id, { status: 'COMPLETED' }, true);
                                      }
                                      Swal.fire('สำเร็จ', 'บันทึกรับของเรียบร้อย', 'success');
                                      fetchData();
                                    }
                                  })
                                }}>
                                  <CheckCircleFill className="me-1" /> รับของทั้งหมด ({items.length})
                                </Button>
                              </div>
                            </div>

                            <Table size="sm" className="mb-0 bg-light rounded">
                              <thead>
                                <tr>
                                  <th className="ps-3">รายการบริจาค</th>
                                  <th>จำนวน</th>
                                  <th>หมวดหมู่</th>
                                  <th className="text-end pe-3">จัดการ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((t: any) => (
                                  <tr key={t._id}>
                                    <td className="ps-3 fw-bold text-success">{t.itemId?.name || t.itemName || 'ระบุเอง'}</td>
                                    <td>{t.quantity.toLocaleString()} {t.itemId?.unit || t.unit}</td>
                                    <td>
                                      <Badge bg={getCategoryColor(t.itemId?.category || t.category || 'ทั่วไป')} className="fw-normal">
                                        {t.itemId?.category || t.category || 'ทั่วไป'}
                                      </Badge>
                                    </td>
                                    <td className="text-end pe-3">
                                      <div className="d-flex justify-content-end gap-1">
                                        <Button size="sm" variant="outline-success" className="py-0 px-2" onClick={() => openReceiptModal(t)}>
                                          แก้ไข/รับ
                                        </Button>
                                        <Button size="sm" variant="outline-danger" className="py-0 px-2" onClick={() => openRejectModal(t)}>
                                          <XCircleFill />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Card.Body>
                        </Card>
                      );
                    });
                  })()}
                </div>
              </Tab>

              {/* --- Requisition Tab --- */}
              <Tab eventKey="requisitions" title={`📤 ใบเบิกจ่าย (${outBatchCount})`}>
                <div className="mt-3">
                  {(() => {
                    const grouped = outPending.reduce((acc: any, t: any) => {
                      const gid = t.groupId || `${t.requesterName}-${t.contactPhone}-${new Date(t.createdAt).setSeconds(0, 0)}`;
                      if (!acc[gid]) acc[gid] = { items: [], meta: t };
                      acc[gid].items.push(t);
                      return acc;
                    }, {});

                    const groups = Object.values(grouped);

                    if (groups.length === 0) return <div className="text-center py-5 text-muted">ไม่มีรายการเบิกจ่ายค้างอนุมัติ</div>;

                    return groups.map((g: any, idx: number) => {
                      const { meta, items } = g;
                      return (
                        <Card key={idx} className="mb-3 border-0 shadow-sm">
                          <Card.Header className="bg-body border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-3">
                              <Badge bg="primary" className="p-2">
                                {meta.centerId ? '📍 มารับเอง (Pickup)' : '🚚 จัดส่ง (Delivery)'}
                              </Badge>
                              {meta.centerId && (
                                <div className="small text-muted border-start ps-3">
                                  <strong>จากจุด:</strong> {meta.centerId.name} ({meta.centerId.district})
                                </div>
                              )}
                            </div>
                            <div className="text-end small text-muted">
                              {new Date(meta.createdAt).toLocaleString('th-TH')}
                            </div>
                          </Card.Header>
                          <Card.Body>
                            <div className="row g-3 mb-3">
                              <div className="col-md-6">
                                <strong className="d-block text-secondary small">ผู้เบิก</strong>
                                <div className="fw-bold">{meta.requesterName}</div>
                                <div className="small text-muted"><TelephoneFill className="me-1" />{meta.contactPhone}</div>
                              </div>
                              <div className="col-md-6 d-flex align-items-center justify-content-md-end gap-2">
                                {meta.proofUrl && (
                                  <Button size="sm" variant="outline-info" onClick={() => openProof(meta.proofUrl)}>
                                    <Eye className="me-1" /> หลักฐาน/เอกสาร
                                  </Button>
                                )}
                                <Button size="sm" variant="outline-danger" onClick={() => openRejectModal(items)}>
                                  <XCircleFill className="me-1" /> ปฏิเสธทั้งหมด
                                </Button>
                                <Button size="sm" variant="success" onClick={() => {
                                  Swal.fire({
                                    title: 'อนุมัติทั้งหมด?',
                                    text: `ยืนยันอนุมัติ ${items.length} รายการของ ${meta.requesterName}?`,
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: 'อนุมัติทั้งหมด',
                                    confirmButtonColor: '#198754'
                                  }).then(async (r) => {
                                    if (r.isConfirmed) {
                                      // Approve all items in group
                                      for (const item of items) {
                                        await executeUpdate(item._id, { status: 'COMPLETED' }, true); // true = silent
                                      }
                                      Swal.fire('สำเร็จ', 'อนุมัติเรียบร้อย', 'success');
                                      fetchData();
                                    }
                                  });
                                }}>
                                  <CheckCircleFill className="me-1" /> อนุมัติทั้งบิล ({items.length})
                                </Button>
                              </div>
                            </div>

                            <Table size="sm" className="mb-0 bg-light rounded">
                              <thead>
                                <tr>
                                  <th className="ps-3">สินค้า</th>
                                  <th>จำนวน</th>
                                  <th>สถานะ</th>
                                  <th className="text-end pe-3">จัดการรายตัว</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((t: any) => (
                                  <tr key={t._id}>
                                    <td className="ps-3 fw-bold">{t.itemId?.name}</td>
                                    <td>{t.quantity.toLocaleString()} {t.itemId?.unit}</td>
                                    <td><Badge bg="warning" text="dark" className="fw-normal">รออนุมัติ</Badge></td>
                                    <td className="text-end pe-3">
                                      <Button size="sm" variant="outline-danger" className="py-0 px-2" onClick={() => openRejectModal(t)}>
                                        <XCircleFill />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Card.Body>
                        </Card>
                      );
                    });
                  })()}
                </div>
              </Tab>
            </Tabs>
          )}
        </Card.Body>
      </Card>

      {/* --- Receipt Modal (On-site Verify) --- */}
      <Modal show={showReceiptModal} onHide={() => setShowReceiptModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>ยืนยันการรับของบริจาค</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>จำนวนที่รับจริง (Verify Quantity)</Form.Label>
            <Form.Control
              type="number"
              value={receiptQty}
              onChange={(e) => setReceiptQty(Number(e.target.value))}
            />
            <Form.Text className="text-muted">แก้ไขจำนวนหากไม่ตรงกับที่แจ้งมา</Form.Text>
          </Form.Group>
          <div className="alert alert-warning small mt-3 mb-0">
            <i className="bi bi-info-circle me-1"></i>
            การกด "ยืนยันการรับของ" จะนำสินค้าเข้าสต็อกและบันทึกประวัติทันที ไม่จำเป็นต้องแนบหลักฐานเพิ่มเติม
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={handleReceiptSubmit}>ยืนยันรับเข้าสต็อก</Button>
        </Modal.Footer>
      </Modal>

      {/* --- Proof Modal --- */}
      <Modal show={showProofModal} onHide={() => setShowProofModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>หลักฐานการเบิกจ่าย</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {proofUrl && <img src={proofUrl} alt="Proof" className="img-fluid rounded shadow-sm" style={{ maxHeight: '70vh' }} />}
        </Modal.Body>
      </Modal>

      {/* --- Reject Modal --- */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>ระบุเหตุผลที่ปฏิเสธ {Array.isArray(rejectTarget) ? `(${rejectTarget.length} รายการ)` : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>เหตุผล:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="เช่น ข้อมูลไม่ครบถ้วน, ของหมดชั่วคราว"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleRejectSubmit}>ยืนยันปฏิเสธ</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}