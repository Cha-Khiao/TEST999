'use client';

import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import { Container, Navbar as BsNavbar, Nav, Button } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Swal from 'sweetalert2';
import { MoonStarsFill, SunFill, PersonCircle } from 'react-bootstrap-icons';

import RequisitionModal from './RequisitionModal';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showRequisition, setShowRequisition] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  // --- เพิ่มตรงนี้: ซ่อน Navbar ถ้าเป็นหน้า Admin หรือ Login ---
  if (pathname.startsWith('/admin') || pathname === '/login') return null;

  return (
    <>
      <BsNavbar expand="lg" className="sticky-top py-3 shadow-sm" variant={theme} style={{ zIndex: 1030 }}>
        <Container>
          <Link href="/" passHref legacyBehavior>
            <BsNavbar.Brand className="fw-bold text-primary d-flex align-items-center gap-2 fs-4">
              💙 Donation System
            </BsNavbar.Brand>
          </Link>
          <BsNavbar.Toggle aria-controls="navbar-nav" className="border-0 shadow-none" />
          <BsNavbar.Collapse id="navbar-nav">
            <Nav className="ms-auto align-items-center gap-2 mt-3 mt-lg-0">

              <Button
                variant={theme === 'light' ? 'light' : 'dark'}
                onClick={toggleTheme}
                className="rounded-circle p-2 d-flex align-items-center justify-content-center border me-2"
                style={{ width: '38px', height: '38px' }}
              >
                {theme === 'light' ? <MoonStarsFill /> : <SunFill className="text-warning" />}
              </Button>

              <Button
                variant="outline-primary text-primary"
                size="sm"
                className="rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm"
                onClick={() => setShowRequisition(true)}
              >
                <i className="bi bi-box-seam"></i> เบิกของ
              </Button>

              <Link href="/login">
                <Button variant="primary" size="sm" className="rounded-pill px-4 d-flex align-items-center gap-2 fw-bold ms-1 shadow-sm">
                  <PersonCircle /> เข้าสู่ระบบ
                </Button>
              </Link>
            </Nav>
          </BsNavbar.Collapse>
        </Container>
      </BsNavbar>

      <RequisitionModal show={showRequisition} onHide={() => setShowRequisition(false)} />
    </>
  );
}