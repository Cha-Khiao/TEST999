import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Center from '@/models/Center';

export async function GET() {
  await dbConnect();
  try {
    // 1. หาข้อมูลที่ไม่มี type แล้วยัดเยียดให้เป็น SHELTER ให้หมด
    const result = await Center.updateMany(
        { type: { $exists: false } }, // เงื่อนไข: คนที่ไม่มี field type
        { $set: { type: 'SHELTER' } } // คำสั่ง: เซ็ตให้เป็น SHELTER
    );

    // 2. (Optional) ถ้าอยากแก้พวกชื่อที่มีคำว่า "จุดรับบริจาค" ให้เป็น DONATION_POINT อัตโนมัติ
    const autoFixPoints = await Center.updateMany(
        { name: { $regex: /จุดรับบริจาค|ศาลากลาง|ที่ว่าการ/ } }, // ถ้าชื่อมีคำเหล่านี้
        { $set: { type: 'DONATION_POINT' } }
    );

    return NextResponse.json({ 
        message: 'ซ่อมแซมข้อมูลเสร็จสิ้น', 
        fixedShelters: result.modifiedCount,
        autoAssignedDonationPoints: autoFixPoints.modifiedCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}