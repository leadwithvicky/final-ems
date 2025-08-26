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
    const department = searchParams.get('department');
    const format = searchParams.get('format');
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
    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      query.employeeId = { $in: employees.map(e => e._id) };
    }

    const payroll = await Payroll.find(query)
      .populate('employeeId', 'firstName lastName email department')
      .populate('processedBy', 'firstName lastName')
      .sort({ year: -1, month: -1 });

    if (format === 'csv') {
      const headers = ['Employee','Email','Department','Month','Year','Basic','Overtime','Bonus','TotalEarnings','TotalDeductions','Net','Status'];
      const rows = payroll.map((p:any)=> {
        const emp = p.employeeId || {};
        const fullName = emp.fullName || (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : '');
        return [
          fullName,
          emp.email || '',
          emp.department || '',
          p.month,
          p.year,
          p.basicSalary,
          p.overtime,
          p.bonus,
          p.totalEarnings,
          p.totalDeductions,
          p.netSalary,
          p.status
        ];
      });
      const csv = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="payroll.csv"'
        }
      });
    }

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
    
    const populatedPayroll = await payroll.populate('employeeId', 'firstName lastName email department');
    
    return NextResponse.json(populatedPayroll, { status: 201 });
  } catch (error) {
    console.error('Error creating payroll:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Simple stats endpoint via query: action=stats
export async function PUT(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      const { month, year } = Object.fromEntries(searchParams.entries());
      const query: any = {};
      if (month) query.month = parseInt(month);
      if (year) query.year = parseInt(year);
      const items = await Payroll.find(query);
      const totalPayout = items.reduce((sum, p) => sum + (p.netSalary || 0), 0);
      const counts = items.reduce((acc: any, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
      return NextResponse.json({ totalPayout, count: items.length, statusCounts: counts });
    }

    return NextResponse.json({ message: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Error in payroll PUT:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}