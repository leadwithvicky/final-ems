import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payroll from '@/lib/models/Payroll';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'No token provided' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const payroll = await Payroll.findById(params.id).populate('employeeId');
    if (!payroll) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    // Employees can only access their own payslip
    if (decoded.role === 'employee' && String((payroll as any).employeeId.user || (payroll as any).employeeId) !== decoded.id) {
      // Fallback: allow if the populated employeeId.user matches
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Build a simple JSON payslip; client can render/download PDF
    const emp: any = payroll.employeeId;
    const payload = {
      id: payroll._id,
      month: payroll.month,
      year: payroll.year,
      employee: {
        name: emp?.fullName || `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim(),
        email: emp?.email,
        department: emp?.department,
        position: emp?.position,
      },
      amounts: {
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        overtime: payroll.overtime,
        bonus: payroll.bonus,
        totalEarnings: payroll.totalEarnings,
        totalDeductions: payroll.totalDeductions,
        netSalary: payroll.netSalary,
      },
      status: payroll.status,
      paymentDate: payroll.paymentDate,
      notes: payroll.notes,
      generatedAt: new Date(),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error generating payslip payload:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


