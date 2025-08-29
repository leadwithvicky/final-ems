import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';

// POST /api/employees/[id]/documents
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, url, expiryDate, verificationStatus, notes } = body;
    if (!type || !url) return NextResponse.json({ message: 'type and url are required' }, { status: 400 });

    const employee = await Employee.findById(params.id);
    if (!employee) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    employee.documents = employee.documents || [];
    employee.documents.push({ type, url, uploadedAt: new Date(), expiryDate, verificationStatus, notes });
    await employee.save();
    return NextResponse.json(employee.documents);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/employees/[id]/documents
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { index, updates } = body as { index: number; updates: Record<string, any> };
    if (index === undefined) return NextResponse.json({ message: 'index is required' }, { status: 400 });

    const employee = await Employee.findById(params.id);
    if (!employee || !employee.documents || index < 0 || index >= employee.documents.length) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    employee.documents[index] = { ...employee.documents[index], ...updates } as any;
    await employee.save();
    return NextResponse.json(employee.documents[index]);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


