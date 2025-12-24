import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  await dbConnect();
  const token = cookies().get('auth_token');
  
  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    // แกะ Token (แบบง่ายที่เราทำไว้คือ base64)
    const tokenString = Buffer.from(token.value, 'base64').toString('utf-8');
    const { id } = JSON.parse(tokenString);

    // ดึงข้อมูล User แต่ไม่เอา Password
    const user = await User.findById(id).select('-password');
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ user: null });
  }
}