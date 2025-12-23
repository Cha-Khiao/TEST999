import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  await dbConnect();
  
  try {
    // 1. เช็คก่อนว่ามีไหม
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      return NextResponse.json({ message: 'Admin user already exists (มีอยู่แล้ว)' });
    }

    // 2. สร้างใหม่
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    
    const newUser = await User.create({
      username: 'admin',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'admin'
    });

    return NextResponse.json({ 
      message: 'Admin created successfully (สร้างสำเร็จแล้ว)', 
      user: { username: newUser.username, id: newUser._id } 
    });

  } catch (error: any) {
    console.error("Seed Admin Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}