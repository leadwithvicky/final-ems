import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';
import User from '@/lib/models/User';
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

    const employees = await Employee.find({}).select('-password');
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify token and check if user is admin or superadmin
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
      firstName,
      lastName,
      email,
      department,
      position,
      salary,
      hireDate,
      password
    } = body;

    if (!firstName || !lastName || !email || !department || !position || !salary || !hireDate || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // Check if user or employee already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 400 });
    }
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return NextResponse.json({ message: 'Employee already exists' }, { status: 400 });
    }

    // Create User (auto-generates employeeId)
    const user = new User({
      name: `${firstName} ${lastName}`,
      email,
      password,
      role: 'employee'
    });
    await user.save();

    // Create Employee linked to User
    const employee = new Employee({
      user: user._id,
      firstName,
      lastName,
      email,
      department,
      position,
      salary,
      hireDate,
      isActive: true
    });
    await employee.save();

    // Return employee info with employeeId
    const employeeResponse = employee.toObject();
    employeeResponse.employeeId = user.employeeId;
    delete employeeResponse.password;

    return NextResponse.json(employeeResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
