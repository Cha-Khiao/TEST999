import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { username, password } = await req.json();

    const user = await User.findOne({ username });
    if (!user) return NextResponse.json({ error: 'ชื่อผู้ใช้งานไม่ถูกต้อง' }, { status: 401 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });

    const tokenData = JSON.stringify({ id: user._id, role: user.role });
    const tokenValue = Buffer.from(tokenData).toString('base64');
    const oneDay = 24 * 60 * 60 * 1000;

    // 1. Cookie ตัวจริง (ปลอดภัยสูง JS อ่านไม่ได้)
    cookies().set('auth_token', tokenValue, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true, // สำคัญ!
      path: '/',
      maxAge: oneDay
    });

    // 2. Cookie สำหรับโชว์ปุ่ม (JS อ่านได้)
    cookies().set('login_status', 'true', {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
      path: '/',
      maxAge: oneDay
    });

    // 3. Cookie บอก Role (JS อ่านได้ - เอาไว้ซ่อนเมนู)
    cookies().set('user_role', user.role, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
      path: '/',
      maxAge: oneDay
    });

    // 4. Cookie บอกชื่อ (JS อ่านได้ - โชว์ใน Sidebar)
    cookies().set('user_name', user.name, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
      path: '/',
      maxAge: oneDay
    });

    return NextResponse.json({ success: true, name: user.name });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}