import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Attendance from '@/lib/models/Attendance';
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
    const date = searchParams.get('date');
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

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const attendance = await Attendance.find(query)
      .populate('employeeId', 'name email department')
      .sort({ date: -1 });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
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
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action, location } = body; // action: 'clockIn' | 'clockOut'

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employeeId: decoded.id,
      date: { $gte: today }
    });

    if (action === 'clockIn') {
      if (attendance) {
        return NextResponse.json({ message: 'Already clocked in today' }, { status: 400 });
      }

      attendance = new Attendance({
        employeeId: decoded.id,
        date: today,
        clockIn: new Date(),
        location
      });

      await attendance.save();
      
      return NextResponse.json({
        message: 'Clocked in successfully',
        attendance: await attendance.populate('employeeId', 'name email')
      }, { status: 201 });
    }

    if (action === 'clockOut') {
      if (!attendance) {
        return NextResponse.json({ message: 'No clock-in record found for today' }, { status: 400 });
      }

      if (attendance.clockOut) {
        return NextResponse.json({ message: 'Already clocked out today' }, { status: 400 });
      }

      attendance.clockOut = new Date();
      await attendance.save();

      return NextResponse.json({
        message: 'Clocked out successfully',
        attendance: await attendance.populate('employeeId', 'name email')
      });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error with attendance action:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
