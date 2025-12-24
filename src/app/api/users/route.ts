import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// Helper: Check if current user is Admin
async function isAdmin() {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token');
    if (!token) return false;

    try {
        const tokenValue = token.value;
        const decoded = JSON.parse(Buffer.from(tokenValue, 'base64').toString('utf-8'));
        if (decoded.role !== 'admin') return false;
        return decoded;
    } catch (e) {
        return false;
    }
}

// GET: List all users
export async function GET(req: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return NextResponse.json(users);
}

// POST: Create new user
export async function POST(req: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { username, password, name, role } = body;

        if (!username || !password || !name) {
            return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
        }

        await dbConnect();

        // Check duplicate
        const existing = await User.findOne({ username });
        if (existing) {
            return NextResponse.json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            password: hashedPassword,
            name,
            role: role || 'staff'
        });

        return NextResponse.json(newUser, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// PUT: Change Password
export async function PUT(req: Request) {
    if (!await isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { id, newPassword } = body;

        if (!id || !newPassword) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        await dbConnect();
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(id, { password: hashedPassword });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// DELETE: Remove user
export async function DELETE(req: Request) {
    const admin = await isAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        // Prevent self-delete
        if (id === admin.id) {
            return NextResponse.json({ error: 'ไม่สามารถลบบัญชีตัวเองได้' }, { status: 400 });
        }

        await dbConnect();
        await User.findByIdAndDelete(id);

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
