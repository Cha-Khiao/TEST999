// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers'; // ใช้จัดการ Cookie

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // --- LOGIC การตรวจสอบ ---
    // เพื่อความเสถียรของ Project ด่วน:
    // เรากำหนดให้ Username: admin และ Password: password1234 ใช้งานได้เสมอ
    // (คุณสามารถเปลี่ยนรหัสตรงนี้ได้เลย)
    
    const isValid = (username === 'admin' && password === 'password1234');

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // --- ถ้าผ่าน ---
    // สร้าง Cookie ชื่อ 'auth_token'
    // กำหนดให้หมดอายุใน 1 วัน (24 * 60 * 60 * 1000)
    const oneDay = 24 * 60 * 60 * 1000;
    
    cookies().set('auth_token', 'logged-in-securely', { 
        secure: true,
        httpOnly: true, // ป้องกัน JavaScript เข้าถึง (ปลอดภัยมาก)
        path: '/',
        maxAge: oneDay
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}