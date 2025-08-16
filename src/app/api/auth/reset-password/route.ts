import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return NextResponse.json({ message: 'Invalid or expired reset link' }, { status: 400 });
    }
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.mustChangePassword = false;
    await user.save();
    return NextResponse.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
