import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payroll from '@/lib/models/Payroll';
import Employee from '@/lib/models/Employee';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const department = searchParams.get('department');
    const team = searchParams.get('team');

    const match: any = {};
    if (month) match.month = Number(month);
    if (year) match.year = Number(year);

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' }
    ];

    if (department) pipeline.push({ $match: { 'employee.department': department } });
    if (team) pipeline.push({ $match: { 'employee.position': team } });

    const results = await Payroll.aggregate([
      ...pipeline,
      {
        $group: {
          _id: '$employeeId',
          employee: { $first: '$employee' },
          basicSalary: { $sum: '$basicSalary' },
          allowances: { $sum: { $add: ['$allowances.housing', '$allowances.transport', '$allowances.meal', '$allowances.other'] } },
          deductions: { $sum: { $add: ['$deductions.tax', '$deductions.insurance', '$deductions.pension', '$deductions.other'] } },
          overtime: { $sum: '$overtime' },
          bonus: { $sum: '$bonus' },
          totalEarnings: { $sum: '$totalEarnings' },
          totalDeductions: { $sum: '$totalDeductions' },
          netSalary: { $sum: '$netSalary' }
        }
      }
    ]);

    const taxAndCompliance = await Payroll.aggregate([
      ...pipeline,
      {
        $group: {
          _id: { m: '$month', y: '$year' },
          tax: { $sum: '$deductions.tax' },
          insurance: { $sum: '$deductions.insurance' },
          pension: { $sum: '$deductions.pension' },
          other: { $sum: '$deductions.other' },
          totalNet: { $sum: '$netSalary' }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } }
    ]);

    const format = searchParams.get('format');
    const payload = {
      filters: { month: month ? Number(month) : undefined, year: year ? Number(year) : undefined, department, team },
      employees: results.map(r => ({
        employeeId: r.employee._id,
        name: r.employee.firstName + ' ' + r.employee.lastName,
        department: r.employee.department,
        basicSalary: r.basicSalary,
        allowances: r.allowances,
        deductions: r.deductions,
        overtime: r.overtime,
        bonus: r.bonus,
        netSalary: r.netSalary
      })),
      taxAndCompliance
    };

    if (format === 'csv') {
      const rows = [['Employee','Department','Net','Bonus','Deductions','Overtime']]
        .concat((payload as any).employees.map((e: any) => [e.name, e.department, e.netSalary, e.bonus, e.deductions, e.overtime]));
      const csv = rows.map(r => r.join(',')).join('\n');
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv' } });
    }

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


