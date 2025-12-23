'use client';

import { useState } from 'react';
import { Center } from '@/types';
import { Card, Badge, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import DonationModal from './DonationModal';

interface Props {
  center: Center;
}

export default function CenterCard({ center }: Props) {
  const [showModal, setShowModal] = useState(false);

  // สร้างลิงก์ Google Maps จากชื่อสถานที่หรือพิกัด
  const mapUrl = center.location 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.location)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.name + ' ' + center.district)}`;

  return (
    <>
      <Card className="h-100 shadow-sm border-0 transition-hover">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <Badge bg={center.status === 'active' ? 'success' : 'secondary'}>
              {center.status === 'active' ? 'เปิดรับบริจาค' : 'ปิด'}
            </Badge>
            <small className="text-muted">{center.shelterType || 'ทั่วไป'}</small>
          </div>
          
          <Card.Title className="fw-bold mb-2 text-truncate" title={center.name}>
            {center.name}
          </Card.Title>
          
          <div className="mb-3 text-secondary" style={{ fontSize: '0.9rem' }}>
            <p className="mb-1 text-truncate">
              📍 <a href={mapUrl} target="_blank" rel="noreferrer" className="text-decoration-none text-primary fw-bold">
                {center.district} {center.subdistrict ? `- ${center.subdistrict}` : ''} ↗
              </a>
            </p>
            <p className="mb-1">
              📞 {center.phoneNumbers && center.phoneNumbers.length > 0 ? (
                 center.phoneNumbers.map((phone, i) => (
                   <span key={i} className="me-2">
                     <a href={`tel:${phone}`} className="text-decoration-none text-secondary hover-primary">
                       {phone}
                     </a>
                   </span>
                 ))
              ) : 'ไม่ระบุ'}
            </p>
            <p className="mb-1">👥 ความจุ: {center.capacity ? `${center.capacity.toLocaleString()} คน` : '-'}</p>
            <p className="mb-0">
              📊 สถานะ: <span className={center.capacityStatus === 'ล้นศูนย์' ? 'text-danger fw-bold' : 'text-success'}>
                {center.capacityStatus || 'ปกติ'}
              </span>
            </p>
          </div>

          <div className="d-grid">
            <Button variant="primary" onClick={() => setShowModal(true)} disabled={center.status !== 'active'}>
              🎁 บริจาคสิ่งของ
            </Button>
          </div>
        </Card.Body>
      </Card>

      <DonationModal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        center={center} 
      />
    </>
  );
}