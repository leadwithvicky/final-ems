import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/lib/models/Task';
import Notification from '@/lib/models/Notification';
import Employee from '@/lib/models/Employee';

export const runtime = 'nodejs';

// Placeholder engagement using tasks and notifications as proxies for activity and feedback
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const team = searchParams.get('team');
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');

    const startDate = start ? new Date(start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = end ? new Date(end) : new Date();

    const taskPipeline: any[] = [
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $lookup: {
          from: 'employees',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' }
    ];
    if (department) taskPipeline.push({ $match: { 'employee.department': department } });
    if (team) taskPipeline.push({ $match: { 'employee.position': team } });

    const taskStats = await Task.aggregate([
      ...taskPipeline,
      {
        $group: {
          _id: '$assignedTo',
          employee: { $first: '$employee' },
          tasksAssigned: { $sum: 1 },
          tasksCompleted: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          avgProgress: { $avg: '$progress' }
        }
      }
    ]);

    // Use notifications count as proxy of feedback interactions
    const employees = taskStats.map((t: any) => t.employee._id);
    const notifications = await Notification.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, userId: { $exists: true } } },
      {
        $lookup: {
          from: 'employees',
          localField: 'userId',
          foreignField: 'user',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      ...(department ? [{ $match: { 'employee.department': department } }] : []),
      ...(team ? [{ $match: { 'employee.position': team } }] : []),
      {
        $group: {
          _id: '$employee._id',
          feedbackCount: { $sum: 1 }
        }
      }
    ]);
    const feedbackMap = new Map(notifications.map((n: any) => [n._id.toString(), n.feedbackCount]));

    const series = taskStats.map((t: any) => ({
      employeeId: t.employee._id,
      name: t.employee.firstName + ' ' + t.employee.lastName,
      department: t.employee.department,
      tasksAssigned: t.tasksAssigned,
      tasksCompleted: t.tasksCompleted,
      avgProgress: Math.round((t.avgProgress || 0) * 10) / 10,
      feedbackInteractions: feedbackMap.get(t.employee._id.toString()) || 0
    }));

    // Basic satisfaction score heuristic
    const satisfaction = series.map(s => ({
      employeeId: s.employeeId,
      name: s.name,
      department: s.department,
      score: Math.min(100, Math.round((s.tasksCompleted / Math.max(s.tasksAssigned, 1)) * 60 + (s.feedbackInteractions ? 40 : 10)))
    }));

    return NextResponse.json({
      period: { startDate, endDate },
      filters: { department, team },
      engagement: series,
      satisfaction
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


