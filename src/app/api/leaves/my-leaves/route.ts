import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Leave from '@/lib/models/Leave';
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

    // Only employees can access their own leaves
    if (decoded.role !== 'employee') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const leaves = await Leave.find({ employee: decoded.id })
      .populate('employee', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error('Error fetching my leaves:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
