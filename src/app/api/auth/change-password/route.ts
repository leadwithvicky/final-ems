import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Both current and new password are required' }, { status: 400 });
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
    }
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
