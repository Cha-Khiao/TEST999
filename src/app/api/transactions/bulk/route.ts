import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import Item from '@/models/Item';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        const { items, centerIds, requesterName, type, donorName, status, contactPhone, proofUrl } = body;

        const transactionStatus = status || 'COMPLETED';

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Please select items' }, { status: 400 });
        }

        // Validation: Must select centers unless IN or PENDING
        if (type !== 'IN' && transactionStatus !== 'PENDING' && (!centerIds || centerIds.length === 0)) {
            return NextResponse.json({ error: 'Please select centers' }, { status: 400 });
        }

        // 1. Validate Stock (Only for COMPLETED OUT)
        if (type !== 'IN' && transactionStatus === 'COMPLETED') {
            const effectiveCenterIds = centerIds || [];
            // Calculate total needed per item: (Quantity Per Center) * (Number of Centers)
            for (const orderItem of items) {
                const itemInDb = await Item.findById(orderItem.itemId);
                if (!itemInDb) return NextResponse.json({ error: `Item not found: ${orderItem.itemId}` }, { status: 404 });

                const totalNeeded = orderItem.quantity * effectiveCenterIds.length;
                if (itemInDb.quantity < totalNeeded) {
                    return NextResponse.json({
                        error: `Stock not enough for ${itemInDb.name}. Needed: ${totalNeeded}, Available: ${itemInDb.quantity}`
                    }, { status: 400 });
                }
            }
        }

        // 2. Execute Transactions
        const transactions = [];

        const shouldUseNullCenter = (!centerIds || centerIds.length === 0);
        const effectiveCenterIds = shouldUseNullCenter ? [null] : centerIds;

        // Generate Group ID for this batch request
        const groupId = `GRP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        // Loop through each Center (or null)
        for (const centerId of effectiveCenterIds) {
            // Loop through each Item
            for (const orderItem of items) {

                let finalItemId = orderItem.itemId;

                // SPECIAL LOGIC: Public Donation (IN + PENDING) where itemId might be missing but itemName exists
                if (!finalItemId && type === 'IN' && transactionStatus === 'PENDING' && orderItem.itemName) {
                    let targetItem = await Item.findOne({ name: orderItem.itemName });
                    if (!targetItem) {
                        targetItem = await Item.create({
                            name: orderItem.itemName,
                            quantity: 0, // Pending stock
                            unit: orderItem.unit || 'ชิ้น',
                            category: orderItem.category || 'รอตรวจสอบ'
                        });
                    }
                    finalItemId = targetItem._id;
                }

                if (!finalItemId) {
                    console.error("Skipping item with no ID or Name:", orderItem);
                    continue;
                }

                // Create Transaction Record
                const trans = await Transaction.create({
                    type: type || 'OUT',
                    itemId: finalItemId,
                    centerId: centerId,
                    quantity: orderItem.quantity,
                    requesterName: requesterName || 'Staff',
                    contactPhone: contactPhone,
                    donorName: donorName,
                    status: transactionStatus,
                    proofUrl: proofUrl || '',
                    groupId: groupId,
                    isPickupRequired: body.isPickupRequired,
                    pickupLocation: body.pickupLocation
                });

                // Update Stock ONLY if COMPLETED
                if (transactionStatus === 'COMPLETED') {
                    const adjustment = type === 'IN' ? orderItem.quantity : -orderItem.quantity;
                    await Item.findByIdAndUpdate(orderItem.itemId, {
                        $inc: { quantity: adjustment }
                    });
                }

                transactions.push(trans);
            }
        }

        return NextResponse.json({ success: true, count: transactions.length });

    } catch (error: any) {
        console.error("Bulk Transaction Error:", error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
