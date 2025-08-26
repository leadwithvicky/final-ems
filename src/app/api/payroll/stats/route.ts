import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payroll from '@/lib/models/Payroll';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'No token provided' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    const query: any = {};
    if (monthParam) query.month = parseInt(monthParam);
    if (yearParam) query.year = parseInt(yearParam);

    // Employees can only see their stats
    if (decoded.role === 'employee') {
      query.employeeId = decoded.id;
    }

    const items = await Payroll.find(query);
    const totalPayout = items.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    const statusCounts = items.reduce((acc: Record<string, number>, p: any) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ count: items.length, totalPayout, statusCounts });
  } catch (error) {
    console.error('Error fetching payroll stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


