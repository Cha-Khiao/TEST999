// src/app/api/transactions/[id]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import Item from '@/models/Item';

// รองรับการ PUT (แก้ไขข้อมูล) เพื่อเปลี่ยนสถานะเป็น COMPLETED
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const transactionId = params.id;
    
    // 1. หา Transaction ที่ต้องการอนุมัติ
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // ป้องกันการกดซ้ำ
    if (transaction.status === 'COMPLETED') {
        return NextResponse.json({ error: 'Already completed' }, { status: 400 });
    }

    // 2. อัปเดตสต็อกสินค้าจริง (บวกจำนวนเพิ่มเข้าไป)
    const item = await Item.findById(transaction.itemId);
    if (item) {
        item.quantity += transaction.quantity;
        
        // ถ้าหมวดหมู่เดิมเป็น "รอตรวจสอบ" (กรณีของใหม่) ให้เปลี่ยนเป็นปกติ
        if (item.category === 'รอตรวจสอบ') {
            item.category = 'ของบริจาคทั่วไป'; 
        }
        await item.save();
    } else {
        // กรณีหา Item ไม่เจอ (ไม่ควรเกิดขึ้นถ้าโค้ดถูก แต่กันไว้ก่อน)
        return NextResponse.json({ error: 'Item not found in stock' }, { status: 404 });
    }

    // 3. เปลี่ยนสถานะ Transaction เป็นสำเร็จ
    transaction.status = 'COMPLETED';
    await transaction.save();

    return NextResponse.json({ message: 'Approved successfully', transaction });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}