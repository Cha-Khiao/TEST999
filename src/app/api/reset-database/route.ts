import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Center from '@/models/Center';
import fs from 'fs';
import path from 'path';

export async function GET() {
  await dbConnect();

  try {
    // ----------------------------------------------------
    // 1. อ่านไฟล์จุดรับบริจาค (12 แห่ง)
    // ----------------------------------------------------
    const donationPath = path.join(process.cwd(), 'src', 'data', 'sisaket_donation_points.json');
    let donationData = [];
    try {
        donationData = JSON.parse(fs.readFileSync(donationPath, 'utf8'));
    } catch (e) {
        console.warn("ไม่พบไฟล์ sisaket_donation_points.json");
    }

    const formattedDonationPoints = Array.isArray(donationData) ? donationData.map((item: any) => ({
      ...item,
      type: 'DONATION_POINT',
      status: 'active'
    })) : [];

    // ----------------------------------------------------
    // 2. อ่านไฟล์ศูนย์อพยพ (OperationCenters.json)
    // ----------------------------------------------------
    const shelterPath = path.join(process.cwd(), 'src', 'data', 'OperationCenters.json');
    let rawShelterData: any = null;
    
    try {
        rawShelterData = JSON.parse(fs.readFileSync(shelterPath, 'utf8'));
    } catch (err) {
        return NextResponse.json({ error: 'ไม่พบไฟล์ src/data/OperationCenters.json' }, { status: 400 });
    }

    // หา Array จริงๆ
    let shelterArray: any[] = [];
    if (Array.isArray(rawShelterData)) {
        shelterArray = rawShelterData;
    } else if (rawShelterData.features && Array.isArray(rawShelterData.features)) {
        shelterArray = rawShelterData.features.map((f: any) => ({ ...f.properties }));
    } else if (rawShelterData.data && Array.isArray(rawShelterData.data)) {
        shelterArray = rawShelterData.data;
    }

    console.log(`Found ${shelterArray.length} items. Mapping data...`);
    
    // Debug: ดูว่าคีย์ชื่ออะไรกันแน่ (ดูใน Terminal ได้เลย)
    if (shelterArray.length > 0) {
        console.log("Sample Keys:", Object.keys(shelterArray[0]));
    }

    // แปลงข้อมูล (เพิ่ม Fallback กัน Error)
    const formattedShelters = shelterArray.map((item: any) => {
      // พยายามหาชื่ออำเภอจากหลายๆ รูปแบบที่เป็นไปได้
      const districtName = item.district || item.District || item.AMPHOE || item.amp_name || item.AMPHOE_T || item.DNAME || item.amp_t || "เมืองศรีสะเกษ"; // ถ้าหาไม่เจอจริงๆ ให้ลงอำเภอเมืองไปก่อน

      return {
        name: item.name || item.Name || item.CENTER_NAME || item.location_name || "ศูนย์พักพิง (ไม่ระบุชื่อ)",
        location: item.location || item.Location || item.COORDINATES || item.lat_long, 
        
        // ตรงนี้แก้ปัญหา District required
        district: districtName,
        
        subdistrict: item.subdistrict || item.Subdistrict || item.TAMBON || item.tum_name || item.TAMBON_T || "-",
        phoneNumbers: item.phoneNumbers || [],
        capacity: item.capacity || 0,
        
        status: 'active',
        type: 'SHELTER',
        shelterType: item.shelterType || 'ศูนย์พักพิง'
      };
    });

    // ----------------------------------------------------
    // 3. ล้างฐานข้อมูลและบันทึกใหม่
    // ----------------------------------------------------
    await Center.deleteMany({}); 

    // บันทึกจุดรับบริจาค
    if (formattedDonationPoints.length > 0) {
        await Center.insertMany(formattedDonationPoints);
    }
    
    // บันทึกศูนย์อพยพ (แบ่งเป็นล็อตๆ กัน Timeout ถ้าข้อมูลเยอะ)
    if (formattedShelters.length > 0) {
        // บันทึกทีละ 500 รายการ
        const chunkSize = 500;
        for (let i = 0; i < formattedShelters.length; i += chunkSize) {
            const chunk = formattedShelters.slice(i, i + chunkSize);
            await Center.insertMany(chunk);
        }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reset Database สำเร็จ (ใส่ค่า Default ให้อำเภอที่หายไปแล้ว)',
      stats: {
        donationPoints: formattedDonationPoints.length,
        shelters: formattedShelters.length,
        total: formattedDonationPoints.length + formattedShelters.length
      }
    });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}