// src/app/api/seed/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Center from '@/models/Center';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    await dbConnect();

    // อ่านไฟล์ JSON
    const filePath = path.join(process.cwd(), 'src/data/OperationCenters.json');
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(jsonData);

    // ตรวจสอบโครงสร้างไฟล์ (ไฟล์ของคุณมี key ชื่อ "data" ที่เป็น array)
    const centers = data.data || [];

    if (centers.length === 0) {
      return NextResponse.json({ message: 'No data found in JSON' }, { status: 400 });
    }

    // ลบข้อมูลเก่าทั้งหมดก่อน (Optional: ถ้าต้องการเริ่มใหม่)
    await Center.deleteMany({});

    // แปลงข้อมูลให้ตรงกับ Model (mapping)
    const formattedCenters = centers.map((c: any) => ({
      name: c.name,
      location: c.location,
      district: c.district,
      subdistrict: c.subdistrict,
      capacity: c.capacity,
      capacityStatus: c.capacityStatus,
      shelterType: c.shelterType,
      phoneNumbers: c.phoneNumbers,
      status: c.status,
    }));

    // บันทึกลง MongoDB
    await Center.insertMany(formattedCenters);

    return NextResponse.json({ 
      message: 'Database seeded successfully', 
      count: formattedCenters.length 
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}