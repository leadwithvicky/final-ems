import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
import Employee from '@/lib/models/Employee';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');
    const department = searchParams.get('department');
    const team = searchParams.get('team');
    const employeeId = searchParams.get('employeeId');

    const startDate = start ? new Date(start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = end ? new Date(end) : new Date();

    const match: any = { date: { $gte: startDate, $lte: endDate } };
    if (employeeId) match.employeeId = employeeId;

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

    // Flags without $function for compatibility: use status and totalHours heuristic
    pipeline.push({
      $addFields: {
        isLate: { $eq: ['$status', 'late'] },
        leftEarly: {
          $cond: [
            { $and: [ { $ifNull: ['$clockOut', false] }, { $ifNull: ['$totalHours', false] } ] },
            { $lt: ['$totalHours', 8] },
            false
          ]
        }
      }
    });

    const results = await Attendance.aggregate([
      ...pipeline,
      {
        $group: {
          _id: { employeeId: '$employeeId' },
          employee: { $first: '$employee' },
          totalDays: { $sum: 1 },
          presentDays: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absentDays: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          lateArrivals: { $sum: { $cond: ['$isLate', 1, 0] } },
          earlyDepartures: { $sum: { $cond: ['$leftEarly', 1, 0] } }
        }
      },
      { $project: { _id: 0 } }
    ]);

    // Heatmap data by date
    const daily = await Attendance.aggregate([
      ...pipeline,
      {
        $group: {
          _id: { d: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.d': 1 } }
    ]);

    const format = searchParams.get('format');
    const responsePayload = {
      period: { startDate, endDate },
      filters: { department, team, employeeId },
      employees: results.map(r => ({
        employeeId: r.employee._id,
        name: r.employee.firstName + ' ' + r.employee.lastName,
        department: r.employee.department,
        presentDays: r.presentDays,
        absentDays: r.absentDays,
        lateArrivals: r.lateArrivals,
        earlyDepartures: r.earlyDepartures
      })),
      daily
    };

    if (format === 'csv') {
      const rows = [['Employee','Department','Present','Absent','Late','EarlyOut']]
        .concat((responsePayload as any).employees.map((e: any) => [e.name, e.department, e.presentDays, e.absentDays, e.lateArrivals, e.earlyDepartures]));
      const csv = rows.map(r => r.join(',')).join('\n');
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv' } });
    }

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


