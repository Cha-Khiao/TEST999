import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Center from '@/models/Center';
import fs from 'fs';
import path from 'path';

export async function GET() {
  await dbConnect();

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'sisaket_donation_points.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const donationPoints = JSON.parse(fileContents);

    // 1. ล้างจุดรับบริจาคเก่าทิ้งทั้งหมด (Reset Donation Points)
    // ข้อมูลศูนย์อพยพ 944 แห่งจะไม่หาย เพราะเราลบเฉพาะ DONATION_POINT
    const deleteResult = await Center.deleteMany({ type: 'DONATION_POINT' });

    // 2. นำเข้าจุดรับบริจาคใหม่ 12 จุด
    await Center.insertMany(donationPoints);

    // 3. (แถม) ซ่อมข้อมูลศูนย์อพยพ 944 แห่ง ให้มั่นใจว่าเป็น SHELTER
    // Logic: อะไรก็ตามที่ไม่ใช่ DONATION_POINT ให้ถือเป็น SHELTER ให้หมด
    const fixShelters = await Center.updateMany(
        { type: { $ne: 'DONATION_POINT' } },
        { $set: { type: 'SHELTER' } }
    );

    return NextResponse.json({ 
      success: true, 
      message: `ระบบ Reset ข้อมูลเรียบร้อยแล้ว`,
      details: {
          deletedOldDonationPoints: deleteResult.deletedCount,
          addedNewDonationPoints: donationPoints.length,
          verifiedShelters: fixShelters.matchedCount
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}