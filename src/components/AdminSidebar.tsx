'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Nav, Button } from 'react-bootstrap';
import {
  Speedometer2,
  BoxSeam,
  CheckCircle,
  GeoAlt,
  BoxArrowLeft,
  PersonBadge,
  MoonStarsFill,
  SunFill
} from 'react-bootstrap-icons';
// ตรวจสอบบรรทัดนี้: ต้อง import จากไฟล์ที่เราสร้างในข้อ 1
import { useTheme } from './ThemeProvider';

interface Props {
  mobile?: boolean;
}

// ต้องมี export default function
export default function AdminSidebar({ mobile }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [role, setRole] = useState<string>('');
  const [name, setName] = useState<string>('Admin');

  useEffect(() => {
    const roleMatch = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (roleMatch) setRole(roleMatch[2]);

    const nameMatch = document.cookie.match(new RegExp('(^| )user_name=([^;]+)'));
    if (nameMatch) setName(decodeURIComponent(nameMatch[2]));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const menuItems = [
    { name: 'ภาพรวม (Dashboard)', path: '/admin', icon: <Speedometer2 size={20} /> },
    { name: 'คลังสินค้า & เบิกจ่าย', path: '/admin/inventory', icon: <BoxSeam size={20} /> },
    { name: 'รายการรออนุมัติ', path: '/admin/approvals', icon: <CheckCircle size={20} /> },
    { name: 'จัดการสถานที่', path: '/admin/locations', icon: <GeoAlt size={20} /> },
    ...(role === 'admin' ? [{ name: 'จัดการผู้ใช้งาน', path: '/admin/users', icon: <PersonBadge size={20} /> }] : []),
  ];

  return (
    <div className={`d-flex flex-column p-3 h-100 ${mobile ? '' : 'justify-content-between'} bg-body`}>

      <div>
        <div className="mb-4 px-2 d-flex align-items-center gap-2 text-primary pt-2">
          <PersonBadge size={28} />
          <div>
            <div className="fs-6 fw-bold text-truncate" style={{ maxWidth: '150px' }} title={name}>{name}</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Admin Control Panel ({role.toUpperCase()})</div>
          </div>
        </div>

        <Nav variant="pills" className="flex-column gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Nav.Item key={item.path}>
                <Link href={item.path} passHref legacyBehavior>
                  <Nav.Link
                    active={isActive}
                    className={`d-flex align-items-center gap-3 py-2 px-3 rounded-3 ${isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-body hover-bg-light'
                      }`}
                    style={{
                      backgroundColor: !isActive && theme === 'dark' ? 'transparent' : undefined,
                    }}
                  >
                    {item.icon}
                    <span className="fw-medium">{item.name}</span>
                  </Nav.Link>
                </Link>
              </Nav.Item>
            );
          })}
        </Nav>
      </div>

      <div className={`mt-4 ${mobile ? '' : 'mt-auto'}`}>
        <hr className="my-3 opacity-25" />

        <Button
          variant={theme === 'light' ? 'light' : 'outline-light'}
          className="w-100 mb-2 d-flex align-items-center justify-content-center gap-2 border"
          onClick={toggleTheme}
        >
          {theme === 'light' ? <MoonStarsFill /> : <SunFill className="text-warning" />}
          <span>{theme === 'light' ? 'โหมดกลางคืน' : 'โหมดกลางวัน'}</span>
        </Button>

        <Button
          variant="outline-danger"
          className="d-flex align-items-center justify-content-center gap-2 w-100"
          onClick={handleLogout}
        >
          <BoxArrowLeft size={18} /> ออกจากระบบ
        </Button>
      </div>
    </div>
  );
}