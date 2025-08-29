import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';

// GET /api/departments/by-name/[department]/employees
export async function GET(request: NextRequest, { params }: { params: { department: string } }) {
  try {
    await connectDB();
    const { department } = params;
    const employees = await Employee.find({ department });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


