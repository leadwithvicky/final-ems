import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payroll from '@/lib/models/Payroll';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query: any = {};

    // Role-based filtering
    if (decoded.role === 'employee') {
      query.employeeId = decoded.id;
    } else if (decoded.role === 'admin') {
      // Admin can see their department employees
      if (employeeId) {
        query.employeeId = employeeId;
      }
    }
    // Superadmin can see all

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payroll = await Payroll.find(query)
      .populate('employeeId', 'name email department')
      .populate('processedBy', 'name')
      .sort({ year: -1, month: -1 });

    return NextResponse.json(payroll);
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      employeeId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      overtime,
      bonus,
      notes
    } = body;

    // Check if payroll already exists for this employee and month
    const existingPayroll = await Payroll.findOne({
      employeeId,
      month,
      year
    });

    if (existingPayroll) {
      return NextResponse.json({ message: 'Payroll already exists for this month' }, { status: 400 });
    }

    const payroll = new Payroll({
      employeeId,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      overtime,
      bonus,
      notes,
      processedBy: decoded.id
    });

    await payroll.save();
    
    const populatedPayroll = await payroll.populate('employeeId', 'name email department');
    
    return NextResponse.json(populatedPayroll, { status: 201 });
  } catch (error) {
    console.error('Error creating payroll:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
