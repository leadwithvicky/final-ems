import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Leave from '@/lib/models/Leave';
import Employee from '@/lib/models/Employee';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const team = searchParams.get('team');
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');

    const startDate = start ? new Date(start) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = end ? new Date(end) : new Date();

    const match: any = {
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    };

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'employees',
          localField: 'employee',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' }
    ];

    if (department) pipeline.push({ $match: { 'employee.department': department } });
    if (team) pipeline.push({ $match: { 'employee.position': team } });

    const byEmployee = await Leave.aggregate([
      ...pipeline,
      { $match: { status: { $in: ['approved', 'pending'] } } },
      {
        $group: {
          _id: '$employee._id',
          employee: { $first: '$employee' },
          approvedDays: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$days', 0] } },
          pendingDays: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$days', 0] } },
          byType: {
            $push: { type: '$leaveType', days: '$days', status: '$status' }
          }
        }
      }
    ]);

    // Department-wise leave trends and pie data
    const departmentTrends = await Leave.aggregate([
      ...pipeline,
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: { d: '$employee.department', m: { $dateToString: { format: '%Y-%m', date: '$startDate' } } },
          days: { $sum: '$days' }
        }
      },
      { $sort: { '_id.m': 1 } }
    ]);

    const leaveTypeBreakdown = await Leave.aggregate([
      ...pipeline,
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$leaveType',
          days: { $sum: '$days' }
        }
      }
    ]);

    // Compose employee wise with available leaves from Employee
    const employeeIds = byEmployee.map((x: any) => x.employee._id);
    const employees = await Employee.find({ _id: { $in: employeeIds } }, { totalLeaves: 1, usedLeaves: 1, firstName: 1, lastName: 1, department: 1 });
    const employeeMap = new Map(employees.map(e => [e._id.toString(), e]));

    const employeesData = byEmployee.map((e: any) => {
      const emp = employeeMap.get(e.employee._id.toString());
      const totalLeaves = emp?.totalLeaves ?? 0;
      const usedLeaves = emp?.usedLeaves ?? 0;
      const availableLeaves = Math.max(totalLeaves - usedLeaves, 0);
      const approved = e.approvedDays || 0;
      return {
        employeeId: e.employee._id,
        name: e.employee.firstName + ' ' + e.employee.lastName,
        department: e.employee.department,
        approvedDays: approved,
        pendingDays: e.pendingDays || 0,
        availableLeaves,
        byType: e.byType
      };
    });

    const pendingApprovals = await Leave.countDocuments({ status: 'pending' });

    // CSV export support
    const format = searchParams.get('format');
    if (format === 'csv') {
      const rows = [['Employee','Department','ApprovedDays','PendingDays','AvailableLeaves']]
        .concat(employeesData.map((e: any) => [e.name, e.department, e.approvedDays, e.pendingDays, e.availableLeaves]));
      const csv = rows.map(r => r.join(',')).join('\n');
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv' } });
    }

    return NextResponse.json({
      period: { startDate, endDate },
      filters: { department, team },
      employees: employeesData,
      pendingApprovals,
      departmentTrends,
      leaveTypeBreakdown
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


