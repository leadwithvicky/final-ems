import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Leave from '@/lib/models/Leave';
import Employee from '@/lib/models/Employee';
import { verifyToken } from '@/lib/auth';
import mongoose from 'mongoose';

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
      const employeeDoc = await Employee.findOne({ user: decoded.id });
      if (!employeeDoc) {
        return NextResponse.json([], { status: 200 });
      }
      leaves = await Leave.find({ employee: employeeDoc._id }).populate('employee', 'firstName lastName email');
    } else {
      // Admin and superadmin can see all leaves
      leaves = await Leave.find({}).populate('employee', 'firstName lastName email');
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
    const { type, startDate, endDate, reason } = body || {};

    // Basic validations
    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ message: 'Invalid dates' }, { status: 400 });
    }
    if (end < start) {
      return NextResponse.json({ message: 'End date must be after start date' }, { status: 400 });
    }

    // Find employee by user id
    const employeeDoc = await Employee.findOne({ user: decoded.id });
    if (!employeeDoc) {
      return NextResponse.json({ message: 'Employee profile not found' }, { status: 404 });
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / msPerDay) + 1;

    const leave = new Leave({
      employee: employeeDoc._id,
      leaveType: type,
      startDate: start,
      endDate: end,
      reason,
      days: diffDays,
      status: 'pending'
    });

    await leave.save();
    const populatedLeave = await leave.populate('employee', 'firstName lastName email');
    return NextResponse.json(populatedLeave, { status: 201 });
  } catch (error) {
    console.error('Error creating leave request:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: (error as any)?.message || 'Internal server error' }, { status: 500 });
  }
}
