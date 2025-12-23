import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import Item from '@/models/Item';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  try {
    const transactionId = params.id;
    
    // 1. หา Transaction
    const transaction = await Transaction.findById(transactionId).populate('itemId');
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    if (transaction.status === 'COMPLETED') {
        return NextResponse.json({ error: 'รายการนี้ถูกอนุมัติไปแล้ว' }, { status: 400 });
    }

    // 2. จัดการกับ Item (รวมยอด)
    let targetItem = await Item.findById(transaction.itemId);
    
    if (targetItem) {
        // เช็คว่ามี Item อื่นที่ชื่อเหมือนกัน (Active) อยู่แล้วไหม
        const existingRealItem = await Item.findOne({ 
            name: targetItem.name, 
            _id: { $ne: targetItem._id }, // ไม่ใช่ตัวมันเอง
            category: { $ne: 'รอตรวจสอบ' } // ไม่ใช่ของรอตรวจสอบ
        });

        if (existingRealItem) {
            // เจอของเดิมที่ชื่อเหมือนกัน! -> เอายอดไปบวกอันเดิม
            existingRealItem.quantity += transaction.quantity;
            await existingRealItem.save();

            // อัปเดต Transaction ให้ชี้ไปที่ของจริง
            transaction.itemId = existingRealItem._id;
            
            // ลบ Item ชั่วคราวทิ้ง (เพราะย้ายยอดไปรวมแล้ว)
            await Item.findByIdAndDelete(targetItem._id);
        } else {
            // ไม่เจอของซ้ำ -> ใช้ Item ตัวเดิมนี้แหละ แต่ปรับสถานะ
            targetItem.quantity += transaction.quantity;
            if (targetItem.category === 'รอตรวจสอบ') {
                targetItem.category = 'ของบริจาคทั่วไป'; 
            }
            await targetItem.save();
        }
    } else {
        return NextResponse.json({ error: 'ไม่พบข้อมูลสินค้าในระบบ' }, { status: 404 });
    }

    // 3. เปลี่ยนสถานะ Transaction เป็นสำเร็จ
    transaction.status = 'COMPLETED';
    await transaction.save();

    return NextResponse.json({ message: 'อนุมัติเรียบร้อย', transaction });

  } catch (error: any) {
    console.error("Approve Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}