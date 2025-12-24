// src/app/api/items/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Item from '@/models/Item';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20; // Default 20 items per page
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const centerId = searchParams.get('centerId');

    const query: any = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    // Default: Hide items with 0 quantity (Ghost Items from Pending Donations)
    // If identifying stock for a specific center, we might still want to see items even if global stock is > 0
    query.quantity = { $gt: 0 };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    let [items, total] = await Promise.all([
      Item.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Item.countDocuments(query)
    ]);

    // If centerId is provided, calculate stock specific to that center
    if (centerId && items.length > 0) {
      const itemIds = items.map((i: any) => i._id);

      const stockData = await Transaction.aggregate([
        {
          $match: {
            centerId: new mongoose.Types.ObjectId(centerId),
            itemId: { $in: itemIds },
            status: 'COMPLETED'
          }
        },
        {
          $group: {
            _id: '$itemId',
            netQty: {
              $sum: {
                $cond: [
                  { $eq: ['$type', 'IN'] },
                  '$quantity',
                  { $multiply: ['$quantity', -1] }
                ]
              }
            }
          }
        }
      ]);

      const stockMap = new Map(stockData.map((s: any) => [s._id.toString(), s.netQty]));

      items = items.map((item: any) => ({
        ...item,
        quantity: stockMap.get(item._id.toString()) || 0
      }));
    }

    return NextResponse.json({
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}