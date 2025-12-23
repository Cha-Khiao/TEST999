// src/components/CenterCard.tsx
'use client';

import { useState } from 'react';
import { Center } from '@/types';
import { Card, Badge, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';
import DonationModal from './DonationModal';

interface Props {
  center: Center;
}

export default function CenterCard({ center }: Props) {
  const [showModal, setShowModal] = useState(false);

  // ฟังก์ชันแสดง Popup เมื่อกดบริจาค (อันเก่า ถ้าไม่ได้ใช้แล้วลบออกได้ หรือเก็บไว้ใช้กับปุ่มอื่น)
  const handleDonateInfo = () => {
    Swal.fire({
      title: `ข้อมูลศูนย์ ${center.name}`,
      text: 'กรุณาติดต่อเจ้าหน้าที่เพื่อสอบถามเพิ่มเติม',
      icon: 'info',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#0d6efd'
    });
  };

  return (
    <> 
      {/* ต้องมี <> ครอบตรงนี้ (จุดเริ่มต้น) */}
      
      <Card className="h-100 shadow-sm border-0 transition-hover">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <Badge bg={center.status === 'active' ? 'success' : 'secondary'}>
              {center.status === 'active' ? 'เปิดรับบริจาค' : 'ปิด'}
            </Badge>
            <small className="text-muted">{center.shelterType || 'ทั่วไป'}</small>
          </div>
          
          <Card.Title className="fw-bold mb-3 text-truncate" title={center.name}>
            {center.name}
          </Card.Title>
          
          <div className="mb-3 text-secondary" style={{ fontSize: '0.9rem' }}>
            <p className="mb-1 text-truncate">📍 {center.district} {center.subdistrict ? `- ${center.subdistrict}` : ''}</p>
            <p className="mb-1">👥 ความจุ: {center.capacity ? `${center.capacity.toLocaleString()} คน` : 'ไม่ระบุ'}</p>
            <p className="mb-0">
              📊 สถานะ: <span className={center.capacityStatus === 'ล้นศูนย์' ? 'text-danger fw-bold' : 'text-success'}>
                {center.capacityStatus || 'ปกติ'}
              </span>
            </p>
          </div>

          <div className="d-grid gap-2">
            <Button variant="primary" onClick={() => setShowModal(true)}>
              🎁 บริจาคสิ่งของ
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Modal วางไว้ตรงนี้ แต่อยู่ภายใน Fragment เดียวกับ Card */}
      <DonationModal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        center={center} 
      />

    </> 
    // ต้องมี </> ปิดท้ายตรงนี้ (จุดสิ้นสุด)
  );
}