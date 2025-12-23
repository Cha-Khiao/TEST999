// src/app/api/centers/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Center from '@/models/Center';

export async function GET(req: Request) {
  await dbConnect();
  
  // ดึงค่า Query Parameter จาก URL
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get('all') === 'true'; // ถ้ามี ?all=true จะเป็นจริง

  try {
    // ถ้า showAll เป็นจริง ให้ดึงทั้งหมด ({}) 
    // ถ้าไม่จริง (หน้าบ้าน) ให้ดึงเฉพาะที่ active ({ status: 'active' })
    const query = showAll ? {} : { status: 'active' };
    
    const centers = await Center.find(query).sort({ createdAt: -1 });
    return NextResponse.json(centers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch centers' }, { status: 500 });
  }
}