import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Task from '@/lib/models/Task';
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
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let query: any = {};

    // Role-based filtering
    if (decoded.role === 'employee') {
      query.assignedTo = decoded.id;
    } else if (decoded.role === 'admin') {
      // Admin can see tasks assigned to their department employees
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }
    }
    // Superadmin can see all

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email department')
      .populate('assignedBy', 'name email')
      .sort({ dueDate: 1 });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
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
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      tags,
      department
    } = body;

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: decoded.id,
      priority,
      dueDate,
      tags,
      department
    });

    await task.save();
    
    const populatedTask = await task.populate('assignedTo', 'name email department');
    
    return NextResponse.json(populatedTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
