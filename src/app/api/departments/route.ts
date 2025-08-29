import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';
import Department from '@/lib/models/Department';
import { verifyToken } from '@/lib/auth';

// GET /api/departments
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const full = searchParams.get('full') === 'true';

    if (!full) {
      // Backward-compatible: return list of names from Employee if full isn't requested
      const departments = await Employee.distinct('department');
      return NextResponse.json(departments);
    }

    const docs = await Department.find({ isActive: true });
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/departments
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, description } = body;
    if (!name) return NextResponse.json({ message: 'Name is required' }, { status: 400 });

    const existing = await Department.findOne({ name });
    if (existing) return NextResponse.json({ message: 'Department already exists' }, { status: 409 });

    const dept = await Department.create({ name, code, description });
    return NextResponse.json(dept, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
