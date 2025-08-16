import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Leave from '@/lib/models/Leave';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    let leaves;
    
    // If user is employee, only show their leaves
    if (decoded.role === 'employee') {
      leaves = await Leave.find({ employee: decoded.id }).populate('employee', 'name email');
    } else {
      // Admin and superadmin can see all leaves
      leaves = await Leave.find({}).populate('employee', 'name email');
    }

    return NextResponse.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    // Verify token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { type, startDate, endDate, reason } = body;

    const leave = new Leave({
      employee: decoded.id,
      leaveType: type,
      startDate,
      endDate,
      reason,
      status: 'pending'
    });

    await leave.save();
    
    const populatedLeave = await leave.populate('employee', 'name email');
    
    return NextResponse.json(populatedLeave, { status: 201 });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
