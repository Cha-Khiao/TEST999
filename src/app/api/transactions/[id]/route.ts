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

        const body = await req.json();
        const { status, rejectionReason, approverName } = body;

        console.log('--- DEBUG PUT TRANSACTION ---');
        console.log('ID:', transactionId);
        console.log('Approver Name:', approverName);

        // กรณีปฏิเสธ/ยกเลิก
        if (status === 'CANCELLED') {
            transaction.status = 'CANCELLED';
            if (rejectionReason) transaction.rejectionReason = rejectionReason;
            if (approverName) transaction.approverName = approverName; // บันทึกชื่อคนกดปฏิเสธด้วย
            await transaction.save();
            return NextResponse.json({ message: 'ปฏิเสธรายการเรียบร้อย', transaction });
        }

        // กรณีอนุมัติ (COMPLETED)
        if (transaction.type === 'IN') {
            // อัปเดตข้อมูลจากการตรวจสอบหน้างาน (ถ้ามี)
            if (body.quantity) transaction.quantity = body.quantity;
            if (body.proofUrl) transaction.proofUrl = body.proofUrl;

            // ... (Logic เดิม ของการรวมของ) ...
            let targetItem = await Item.findById(transaction.itemId);
            if (targetItem) {
                const existingRealItem = await Item.findOne({
                    name: targetItem.name,
                    _id: { $ne: targetItem._id },
                    category: { $ne: 'รอตรวจสอบ' }
                });

                if (existingRealItem) {
                    existingRealItem.quantity += transaction.quantity;
                    await existingRealItem.save();
                    transaction.itemId = existingRealItem._id;
                    await Item.findByIdAndDelete(targetItem._id);
                } else {
                    targetItem.quantity += transaction.quantity;
                    if (targetItem.category === 'รอตรวจสอบ') {
                        targetItem.category = 'ของบริจาคทั่วไป';
                    }
                    await targetItem.save();
                }
            }
        } else if (transaction.type === 'OUT') {
            // ตัดสต็อกจริง
            const item = await Item.findById(transaction.itemId);
            if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

            if (item.quantity < transaction.quantity) {
                return NextResponse.json({ error: 'Not enough stock to approve' }, { status: 400 });
            }

            item.quantity -= transaction.quantity;
            await item.save();
        }

        // 3. เปลี่ยนสถานะ Transaction เป็นสำเร็จ
        transaction.status = 'COMPLETED';
        if (approverName) transaction.approverName = approverName;
        await transaction.save();

        return NextResponse.json({ message: 'อนุมัติเรียบร้อย', transaction });

    } catch (error: any) {
        console.error("Approve Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}