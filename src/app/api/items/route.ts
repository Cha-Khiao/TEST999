// src/app/api/items/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Item from '@/models/Item';

export async function GET() {
  await dbConnect();
  try {
    // ดึงข้อมูลสินค้าทั้งหมด เรียงตามเวลาแก้ไขล่าสุด
    const items = await Item.find({}).sort({ updatedAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}