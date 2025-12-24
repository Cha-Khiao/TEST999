// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import Item from '@/models/Item';

export const dynamic = 'force-dynamic';

// GET: ดึงรายการทั้งหมด (พร้อม Pagination)
export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;
  const skip = (page - 1) * limit;
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const search = searchParams.get('search');

  const query: any = {};

  if (status) {
    query.status = status;
  } else {
    // Default: Exclude PENDING
    query.status = { $ne: 'PENDING' };
  }

  if (type && type !== 'All') query.type = type;

  // Search Filter (Donor Name, Requester Name, Approver Name)
  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    query.$or = [
      { donorName: searchRegex },
      { requesterName: searchRegex },
      { approverName: searchRegex }
    ];
  }

  // Date Filter (Month & Year)
  if (month && year) {
    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
    query.createdAt = {
      $gte: startDate,
      $lte: endDate
    };
  } else if (year) {
    const startDate = new Date(Number(year), 0, 1);
    const endDate = new Date(Number(year), 11, 31, 23, 59, 59);
    query.createdAt = {
      $gte: startDate,
      $lte: endDate
    };
  }

  try {
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('itemId')
        .populate('centerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(query)
    ]);

    return NextResponse.json({
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST: สร้างรายการ
export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    console.log('--- DEBUG POST TRANSACTION ---');
    console.log('Payload:', JSON.stringify(body, null, 2));

    // เพิ่ม: tempItemName สำหรับเคส Pending Donation
    const { type, itemId, centerId, quantity, donorName, requesterName, status, itemName, unit, category } = body;

    // กรณีบริจาคจากหน้าเว็บ (PENDING) -> ยังไม่มี itemId จริง
    // กรณีบริจาค/เบิกของ จากหน้าเว็บ (PENDING)
    if (status === 'PENDING') {
      const { proofUrl, isPickupRequired, pickupLocation, contactPhone } = body;

      if (type === 'IN') {
        // ... (Donation Logic) ...
        let targetItem = await Item.findOne({ name: itemName });
        if (!targetItem) {
          targetItem = await Item.create({
            name: itemName,
            quantity: 0,
            unit: unit,
            category: category || 'รอตรวจสอบ'
          });
        }

        const transaction = await Transaction.create({
          type: 'IN',
          itemId: targetItem._id,
          centerId,
          quantity,
          donorName,
          contactPhone,
          proofUrl,
          isPickupRequired,
          pickupLocation,
          status: 'PENDING'
        });
        return NextResponse.json(transaction);

      } else if (type === 'OUT') {
        // ... (Requisition Logic) ...
        // ตรวจสอบสต็อกเบื้องต้น? (อาจจะไม่ตัดทันที แต่ควรเช็คว่ามีของไหม)
        const item = await Item.findById(itemId);
        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        if (item.quantity < quantity) return NextResponse.json({ error: 'Not enough stock (Pending)' }, { status: 400 });

        const transaction = await Transaction.create({
          type: 'OUT',
          itemId,
          centerId,
          quantity,
          requesterName,
          contactPhone, // เพิ่มเบอร์โทร
          proofUrl, // สมมติว่ามีเอกสารแนบการเบิก
          status: 'PENDING'
        });
        return NextResponse.json(transaction);
      }
    }

    // --- กรณีปกติ (Admin ทำรายการ) --- (Code เดิม)
    const item = await Item.findById(itemId);
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    if (type === 'OUT') {
      if (item.quantity < quantity) return NextResponse.json({ error: 'Not enough stock' }, { status: 400 });
      item.quantity -= quantity;
    } else if (type === 'IN') {
      item.quantity += Number(quantity);
    }

    await item.save();

    const transaction = await Transaction.create({
      type,
      itemId,
      centerId: type === 'OUT' ? centerId : null,
      quantity,
      donorName,
      requesterName,
      status: 'COMPLETED'
    });

    return NextResponse.json(transaction);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}