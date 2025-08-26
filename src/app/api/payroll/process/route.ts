import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payroll from '@/lib/models/Payroll';
import Employee from '@/lib/models/Employee';
import Attendance from '@/lib/models/Attendance';
import Leave from '@/lib/models/Leave';
import { verifyToken } from '@/lib/auth';

function getMonthDateRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'No token provided' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { month, year, employeeId, notes, recompute, recomputeReason, bonus, allowances: overrides } = await request.json();
    if (!month || !year) {
      return NextResponse.json({ message: 'month and year are required' }, { status: 400 });
    }

    const { start, end } = getMonthDateRange(year, month);

    const employeeQuery: any = { isActive: true };
    if (employeeId) employeeQuery._id = employeeId;
    const employees = await Employee.find(employeeQuery);

    const results: any[] = [];
    const blockedRecomputes: any[] = [];

    for (const emp of employees) {
      try {
        // Handle existing payroll
        const existing = await Payroll.findOne({ employeeId: emp._id, month, year });
        
        if (existing) {
          // Check if recompute is allowed based on status
          if (recompute) {
            if (existing.status === 'finalized' || existing.status === 'paid') {
              // Only superadmin can recompute finalized/paid payroll
              if (decoded.role !== 'superadmin') {
                blockedRecomputes.push({
                  employeeId: emp._id,
                  employeeName: emp.name,
                  status: existing.status,
                  reason: `Cannot recompute ${existing.status} payroll. Only superadmin can override.`
                });
                continue;
              }
            }
            
            // Log the recompute action
            existing.recomputedBy = decoded.id as any;
            existing.recomputedAt = new Date();
            existing.recomputeReason = recomputeReason || 'Manual recompute';
          } else {
            results.push({ employeeId: emp._id, status: 'exists', message: 'Payroll already exists for this month' });
            continue;
          }
        }

        // Attendance aggregation
        const attendanceRecords = await Attendance.find({
          employeeId: emp._id,
          date: { $gte: start, $lte: end }
        });

        const totalHours = attendanceRecords.reduce((sum, r: any) => sum + (r.totalHours || 0), 0);
        const standardMonthlyHours = 8 * 22; // 22 working days baseline
        const overtimeHours = Math.max(totalHours - standardMonthlyHours, 0);
        const overtimeRatePerHour = (emp.salary / standardMonthlyHours) * 1.25; // 25% uplift
        const overtimeAmount = Math.round(overtimeHours * overtimeRatePerHour);

        // Paid/Unpaid leave mapping
        const approvedLeaves = await Leave.find({
          employee: emp._id,
          status: 'approved',
          startDate: { $lte: end },
          endDate: { $gte: start }
        });
        const paidTypes = new Set(['annual','sick','maternity','paternity']);
        const unpaidLeaveDays = approvedLeaves
          .filter((l: any) => !paidTypes.has(l.leaveType))
          .reduce((sum: number, l: any) => sum + (l.days || 0), 0);
        const perDayRate = emp.salary / 22; // simple pro-rata
        const unpaidLeaveDeduction = Math.round(unpaidLeaveDays * perDayRate);

        // Tax slabs
        const monthly = emp.salary;
        let taxRate = 0;
        if (monthly <= 25000) taxRate = 0;
        else if (monthly <= 50000) taxRate = 0.05;
        else if (monthly <= 100000) taxRate = 0.10;
        else taxRate = 0.15;
        const tax = Math.round(monthly * taxRate);

        // Apply admin overrides if provided
        const allowances = {
          housing: Math.max(0, Math.round(overrides?.housing ?? 0)),
          transport: Math.max(0, Math.round(overrides?.transport ?? 0)),
          meal: Math.max(0, Math.round(overrides?.meal ?? 0)),
          other: Math.max(0, Math.round(overrides?.other ?? 0))
        };
        const deductions = { tax, insurance: 0, pension: 0, other: unpaidLeaveDeduction };
        const bonusAmount = Math.max(0, Math.round(bonus ?? 0));

        if (existing && recompute) {
          existing.basicSalary = emp.salary;
          existing.allowances = allowances as any;
          existing.deductions = deductions as any;
          existing.overtime = overtimeAmount;
          existing.bonus = bonusAmount;
          existing.notes = notes || undefined;
          existing.status = 'processed'; // Reset to processed when recomputed
          existing.processedBy = decoded.id as any;
          await existing.save();
          results.push({ 
            employeeId: emp._id, 
            status: 'recomputed',
            message: `Payroll recomputed by ${decoded.role}${recomputeReason ? ` - ${recomputeReason}` : ''}`
          });
          continue;
        }

        const payroll = new Payroll({
          employeeId: emp._id,
          month,
          year,
          basicSalary: emp.salary,
          allowances,
          deductions,
          overtime: overtimeAmount,
          bonus: bonusAmount,
          notes: notes || undefined,
          processedBy: decoded.id,
          status: 'processed'
        });

        await payroll.save();
        results.push({ employeeId: emp._id, status: 'created' });
      } catch (e: any) {
        results.push({ employeeId: emp._id, status: 'error', error: e?.message || 'Unknown error' });
      }
    }

    return NextResponse.json({ 
      message: 'Payroll processed', 
      results,
      blockedRecomputes: blockedRecomputes.length > 0 ? blockedRecomputes : undefined
    });
  } catch (error) {
    console.error('Error processing payroll:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


