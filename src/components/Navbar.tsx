// src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import { Container, Navbar as BsNavbar, Nav, Button } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // เช็คสถานะล็อกอิน
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // เช็ค Cookie แบบง่ายๆ ว่ามี auth_token ไหม (สำหรับ UI เท่านั้น Security จริงอยู่ที่ Middleware)
    const checkLogin = () => {
        const cookies = document.cookie.split(';');
        const hasAuth = cookies.some(c => c.trim().startsWith('auth_token='));
        setIsLoggedIn(hasAuth);
    };
    checkLogin();
  }, [pathname]); // เช็คใหม่ทุกครั้งที่เปลี่ยนหน้า

  const handleLogout = async () => {
    // ลบ Cookie
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsLoggedIn(false);
    
    Swal.fire({
        icon: 'success',
        title: 'ออกจากระบบแล้ว',
        timer: 1500,
        showConfirmButton: false
    });
    
    router.push('/login');
    router.refresh();
  };

  if (!mounted) return null;

  // ซ่อน Navbar ในหน้า Login เพื่อความสวยงาม
  if (pathname === '/login') return null;

  return (
    <BsNavbar expand="lg" className="shadow-sm sticky-top" style={{ backgroundColor: theme === 'dark' ? '#1a1e21' : '#ffffff' }} variant={theme}>
      <Container>
        <Link href="/" passHref legacyBehavior>
          <BsNavbar.Brand className="fw-bold text-primary">
            💙 Donation System
          </BsNavbar.Brand>
        </Link>
        <BsNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BsNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center gap-2">
            
            <Link href="/" passHref legacyBehavior>
              <Nav.Link active={pathname === '/'}>หน้าหลัก</Nav.Link>
            </Link>

            {/* แสดงเมนู Admin เฉพาะตอนล็อกอินแล้ว */}
            {isLoggedIn && (
                <Link href="/admin" passHref legacyBehavior>
                <Nav.Link active={pathname === '/admin'}>จัดการข้อมูล (Admin)</Nav.Link>
                </Link>
            )}

            <div className="vr d-none d-lg-block mx-2"></div>

            <Button 
              variant={theme === 'light' ? 'outline-dark' : 'outline-light'} 
              size="sm" 
              onClick={toggleTheme}
              className="rounded-pill px-3"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>

             {/* ปุ่ม Login / Logout */}
             {isLoggedIn ? (
                <Button variant="danger" size="sm" className="rounded-pill px-3 ms-2" onClick={handleLogout}>
                    Logout
                </Button>
             ) : (
                <Link href="/login">
                    <Button variant="primary" size="sm" className="rounded-pill px-3 ms-2">
                        เจ้าหน้าที่ Login
                    </Button>
                </Link>
             )}

          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
}