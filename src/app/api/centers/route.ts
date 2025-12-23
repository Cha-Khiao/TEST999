// src/app/api/centers/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Center from '@/models/Center';

export async function GET() {
  await dbConnect();
  try {
    const centers = await Center.find({ status: 'active' }).sort({ createdAt: -1 });
    return NextResponse.json(centers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch centers' }, { status: 500 });
  }
}