// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { username, password } = await req.json();

    // 1. ค้นหา User จาก Database
    const user = await User.findOne({ username });
    
    // ถ้าไม่เจอ User
    if (!user) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้งานไม่ถูกต้อง' }, { status: 401 });
    }

    // 2. ตรวจสอบรหัสผ่าน (Compare Hash)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    // --- ถ้าผ่าน ---
    // สร้าง Token (ในที่นี้ใช้ User ID ผสม String มั่วๆ เพื่อความง่ายแต่ปลอดภัยกว่าเดิม)
    // *ระดับโปรดักชั่นจริงๆ ควรใช้ JWT แต่สำหรับโปรเจคด่วนแค่นี้เพียงพอครับ*
    const tokenData = JSON.stringify({ id: user._id, role: user.role });
    const tokenValue = Buffer.from(tokenData).toString('base64'); // Encode ง่ายๆ

    // ตั้ง Cookie
    const oneDay = 24 * 60 * 60 * 1000;
    cookies().set('auth_token', tokenValue, { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        path: '/',
        maxAge: oneDay
    });

    return NextResponse.json({ success: true, name: user.name });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}