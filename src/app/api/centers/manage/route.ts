import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Center from '@/models/Center';

// POST: เพิ่มศูนย์ใหม่
export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const newCenter = await Center.create(body);
    return NextResponse.json(newCenter);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: แก้ไขข้อมูลศูนย์
export async function PUT(req: Request) {
  await dbConnect();
  try {
    const { _id, ...updateData } = await req.json();
    const updatedCenter = await Center.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json(updatedCenter);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: ลบศูนย์
export async function DELETE(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await Center.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}