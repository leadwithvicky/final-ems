import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Employee from '@/lib/models/Employee';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

// GET /api/employees/[id]
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const employee = await Employee.findById(params.id).populate('manager', 'firstName lastName email');
    if (!employee) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/employees/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowed = [
      'firstName','lastName','email','gender','dateOfBirth','phone','department','position','salary','hireDate',
      'employmentType','status','manager','address','emergencyContact','bankDetails','workLocation','shift','contractEndDate'
    ];
    const update: Record<string, any> = {};
    for (const key of allowed) if (key in body) update[key] = body[key];

    const employee = await Employee.findByIdAndUpdate(
      params.id,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!employee) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    // Keep User email/name in sync if changed
    if (update.firstName || update.lastName || update.email) {
      const linked = await User.findById(employee.user);
      if (linked) {
        if (update.email) linked.email = update.email;
        if (update.firstName || update.lastName) linked.name = `${update.firstName ?? employee.firstName} ${update.lastName ?? employee.lastName}`;
        await linked.save();
      }
    }

    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/employees/[id] (deactivate)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const employee = await Employee.findByIdAndUpdate(
      params.id,
      { $set: { isActive: false, status: 'inactive' } },
      { new: true }
    );
    if (!employee) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Employee deactivated' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


