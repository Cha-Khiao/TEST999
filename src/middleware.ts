// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ดึงค่า Cookie ที่ชื่อ 'auth_token'
  const token = request.cookies.get('auth_token');

  // ถ้าพยายามเข้าหน้า /admin แต่ไม่มี token
  if (request.nextUrl.pathname.startsWith('/admin') && !token) {
    // ดีดกลับไปหน้า /login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ถ้าล็อกอินแล้ว แต่อยู่หน้า /login ให้ดีดไป /admin เลย (อำนวยความสะดวก)
  if (request.nextUrl.pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

// กำหนดว่า Middleware นี้จะทำงานเฉพาะหน้าไหนบ้าง
export const config = {
  matcher: ['/admin/:path*', '/login'],
};