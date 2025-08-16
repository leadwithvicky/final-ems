import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';

// GET /api/departments
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    // Get all unique department names
    const departments = await Employee.distinct('department');
    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
