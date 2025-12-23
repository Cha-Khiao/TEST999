// src/app/api/items/create/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Item from '@/models/Item';

export async function POST(req: Request) {
  await dbConnect();
  try {
    const body = await req.json();
    const newItem = await Item.create(body);
    return NextResponse.json(newItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}