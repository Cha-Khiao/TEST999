import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // ลบ Cookie ทั้งสองตัว
  cookies().delete('auth_token');
  cookies().delete('login_status');

  return NextResponse.json({ success: true });
}