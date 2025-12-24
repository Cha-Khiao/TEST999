import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  // 1. ป้องกันหน้า Admin (Frontend)
  if (pathname.startsWith('/admin') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. ป้องกัน API ของ Admin (Backend)
  if (pathname.startsWith('/api')) {
    // รายการ API ที่อนุญาตให้เข้าถึงได้โดยไม่ต้อง Login
    const isPublicApi =
      pathname === '/api/login' ||
      pathname === '/api/seed-admin' ||
      pathname === '/api/centers' ||
      pathname === '/api/items' || // ให้หน้าบ้านดึงของไปโชว์ได้ (ถ้าต้องการ)
      (pathname === '/api/transactions' && request.method === 'POST'); // หน้าบ้านบริจาคได้

    if (!isPublicApi && !token) {
      return NextResponse.json(
        { error: 'Unauthorized: กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }
  }

  // Redirect Login -> Admin ถ้าล็อกอินแล้ว
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/api/:path*'],
};