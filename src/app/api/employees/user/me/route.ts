import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Employee from '@/lib/models/Employee';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const employee = await Employee.findOne({ user: decoded.id });
    const user = await User.findById(decoded.id);
    if (!employee || !user) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      employee: employee.toObject(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
        avatarUpdatedAt: user.avatarUpdatedAt || null
      }
    });
  } catch (error) {
    console.error('GET me profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, email, phone, department, position } = body;

    if (!firstName || !lastName || !email || !department || !position) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const employee = await Employee.findOneAndUpdate(
      { user: decoded.id },
      { firstName, lastName, email, phone: phone || undefined, department, position },
      { new: true }
    );
    if (!employee) {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
    }

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { name: `${firstName} ${lastName}`, email },
      { new: true }
    );

    return NextResponse.json({
      employee: employee.toObject(),
      user: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        avatarUrl: user?.avatarUrl || null,
        avatarUpdatedAt: user?.avatarUpdatedAt || null
      }
    });
  } catch (error) {
    console.error('PUT me profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}



