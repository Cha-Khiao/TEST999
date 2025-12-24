'use client';

import { useState } from 'react';
import { Center } from '@/types';
import { Card, Badge, Button } from 'react-bootstrap';
import { GeoAltFill, TelephoneFill, PeopleFill, GiftFill } from 'react-bootstrap-icons';
import DonationModal from './DonationModal';

interface Props { center: Center; }

export default function CenterCard({ center }: Props) {
    const [showModal, setShowModal] = useState(false);

    // Logic: ถ้ามี location (Admin) ไปพิกัดจริง, ถ้าไม่มี (Public) ไปแค่ชื่ออำเภอ
    const getMapLink = () => {
        if (center.location) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.location)}`;
        } else {
            const locationQuery = `${center.subdistrict || ''} ${center.district || ''} ${center.name}`;
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery.trim())}`;
        }
    };

    const mapUrl = getMapLink();
    const isGPS = !!center.location; // ตรวจสอบว่าเป็นพิกัด GPS จริงหรือไม่

    return (
        <>
            <Card className="h-100 position-relative border-0 shadow-sm transition-hover">
                <Card.Body className="d-flex flex-column">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Badge bg={center.status === 'active' ? 'success' : 'secondary'} className="px-3 py-2 rounded-pill fw-normal">
                            {center.status === 'active' ? '🟢 เปิดรับบริจาค' : '⚪ ปิดชั่วคราว'}
                        </Badge>
                        <small className="text-muted bg-body-secondary px-2 py-1 rounded">
                            {center.shelterType || 'ทั่วไป'}
                        </small>
                    </div>

                    <Card.Title className="fw-bold mb-3 fs-5 text-truncate" title={center.name}>{center.name}</Card.Title>

                    <div className="flex-grow-1">
                        {/* Location */}
                        <div className="d-flex align-items-start gap-2 mb-2 text-secondary">
                            <GeoAltFill className="mt-1 flex-shrink-0 text-primary" />
                            <div>
                                <a href={mapUrl} target="_blank" rel="noreferrer" className="text-decoration-none text-body hover-primary fw-bold">
                                    {center.district} {center.subdistrict && `- ${center.subdistrict}`}
                                </a>
                                <small className={`d-block ${isGPS ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                                    {isGPS ? '📍 นำทางด้วย GPS แม่นยำ' : '🗺️ แผนที่สังเขป (เพื่อความปลอดภัย)'}
                                </small>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="d-flex align-items-center gap-2 mb-2 text-secondary">
                            <TelephoneFill className="flex-shrink-0 text-success" />
                            <div>
                                {center.phoneNumbers?.length ? center.phoneNumbers.map((p, i) => (
                                    <a key={i} href={`tel:${p}`} className="text-decoration-none text-body me-2 border-bottom border-dotted">
                                        {p}
                                    </a>
                                )) : '-'}
                            </div>
                        </div>

                        {/* Capacity */}
                        <div className="d-flex align-items-center gap-2 mb-2 text-secondary">
                            <PeopleFill className="flex-shrink-0 text-info" />
                            <span>ความจุ: <strong>{center.capacity?.toLocaleString() || '-'}</strong> คน</span>
                        </div>

                        {/* Status Text */}
                        <div className="mt-2 pt-2 border-top">
                            <small className="text-muted">สถานะความหนาแน่น:</small>
                            <div className={`fw-bold ${center.capacityStatus === 'ล้นศูนย์' ? 'text-danger' : 'text-success'}`}>
                                {center.capacityStatus || 'ปกติ'}
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        className="w-100 mt-3 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                        onClick={() => setShowModal(true)}
                        disabled={center.status !== 'active'}
                    >
                        <GiftFill /> {center.status === 'active' ? 'แจ้งบริจาคสิ่งของ' : 'งดรับชั่วคราว'}
                    </Button>
                </Card.Body>
            </Card>

            <DonationModal show={showModal} onHide={() => setShowModal(false)} center={center} />
        </>
    );
}