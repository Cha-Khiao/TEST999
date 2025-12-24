import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Center from '@/models/Center';

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    console.log("API POST Body:", body); // ดู Log ตรงนี้

    const newCenter = await Center.create({
        ...body,
        type: body.type || 'SHELTER'
    });
    return NextResponse.json(newCenter);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const { _id, ...updateData } = body;
    
    console.log("API PUT ID:", _id);
    console.log("API PUT Type:", updateData.type); // ดู Log ตรงนี้ ว่าเป็น DONATION_POINT ไหม

    const updatedCenter = await Center.findByIdAndUpdate(
        _id, 
        { 
            ...updateData,
            type: updateData.type // บังคับอัปเดต
        }, 
        { new: true, runValidators: true }
    );

    return NextResponse.json(updatedCenter);
  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await Center.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}