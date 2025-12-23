// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import Item from '@/models/Item';

// GET: ดึงรายการทั้งหมด
export async function GET() {
  await dbConnect();
  // populate ทั้ง Item และ Center เพื่อให้ได้ชื่อมาแสดง
  const transactions = await Transaction.find()
    .populate('itemId')
    .populate('centerId')
    .sort({ createdAt: -1 });
  return NextResponse.json(transactions);
}

// POST: สร้างรายการ
export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    // เพิ่ม: tempItemName สำหรับเคส Pending Donation
    const { type, itemId, centerId, quantity, donorName, requesterName, status, itemName, unit, category } = body;

    // กรณีบริจาคจากหน้าเว็บ (PENDING) -> ยังไม่มี itemId จริง
    if (status === 'PENDING') {
      // สร้าง Transaction แบบพิเศษ โดยเราจะเก็บข้อมูลของไว้ใน donorName หรือ field ชั่วคราว
      // แต่เพื่อให้ระบบสมบูรณ์ เราควรสร้าง Item ไว้เลยแต่ตั้ง quantity = 0? 
      // หรือสร้าง Transaction ที่ไม่มี ItemId? 
      // **ทางออก:** สร้าง Item ใหม่ไปเลยครับ แต่แยก category ว่า "รอตรวจสอบ"
      
      // 1. สร้าง Item รอไว้ก่อน (หรือค้นหาชื่อซ้ำ)
      let targetItem = await Item.findOne({ name: itemName });
      if (!targetItem) {
        targetItem = await Item.create({
          name: itemName,
          quantity: 0, // ยังไม่เพิ่มสต็อกจริง
          unit: unit,
          category: category || 'รอตรวจสอบ'
        });
      }

      // 2. สร้าง Transaction PENDING
      const transaction = await Transaction.create({
        type: 'IN',
        itemId: targetItem._id,
        centerId,
        quantity,
        donorName,
        status: 'PENDING'
      });
      return NextResponse.json(transaction);
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