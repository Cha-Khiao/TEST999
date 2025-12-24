import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import Center from '@/models/Center';

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // กรองประเภท: DONATION_POINT หรือ SHELTER
  const search = searchParams.get('search') || ''; // คำค้นหา
  const page = parseInt(searchParams.get('page') || '1'); // หน้าที่เท่าไหร่
  const limit = parseInt(searchParams.get('limit') || '10'); // จำนวนต่อหน้า

  try {
    // 1. สร้าง Query ตามเงื่อนไข
    const query: any = { status: 'active' };

    // ถ้ามีการส่ง type มา (เช่นเลือก Tab) ให้กรองตามนั้น
    if (type) {
      query.type = type;
    }

    // *** SECURITY CHECK ***
    // ถ้าไม่มี Token (ไม่ใช่ Admin) บังคับให้ดึงได้แค่จุดรับบริจาคเท่านั้น
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token');

    if (!token) {
      query.type = 'DONATION_POINT';
    }

    // ถ้ามีคำค้นหา (Search) ให้หาจากชื่อ หรือ อำเภอ
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. คำนวณ Skip (ข้ามข้อมูล)
    // ตรวจสอบว่ามีการขอข้อมูลทั้งหมดไหม (all=true)
    const isAll = searchParams.get('all') === 'true';
    const skip = isAll ? 0 : (page - 1) * limit;
    const limitQuery = isAll ? 0 : limit; // 0 in mongoose limit means no limit

    // 3. ดึงข้อมูล + นับจำนวนทั้งหมด (เพื่อทำปุ่มแบ่งหน้า)
    const [centers, total] = await Promise.all([
      Center.find(query)
        .sort({ createdAt: -1 }) // เรียงจากใหม่ไปเก่า
        .skip(skip)
        .limit(limitQuery)
        .lean(),
      Center.countDocuments(query)
    ]);

    // 4. ส่งข้อมูลกลับพร้อม Metadata การแบ่งหน้า
    return NextResponse.json({
      data: centers,
      meta: {
        total,
        page,
        limit: isAll ? total : limit,
        totalPages: isAll ? 1 : Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}