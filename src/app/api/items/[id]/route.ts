import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Item from '@/models/Item';

// PUT: แก้ไขข้อมูลสินค้า
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const body = await req.json();
        const updatedItem = await Item.findByIdAndUpdate(params.id, body, { new: true });

        if (!updatedItem) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json(updatedItem);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

// DELETE: ลบสินค้า
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const deletedItem = await Item.findByIdAndDelete(params.id);

        if (!deletedItem) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
