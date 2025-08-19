import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }
    const user = await User.findOne({ email });
    if (!user) {
      // Always return success for security
      return NextResponse.json({ message: 'If your email exists, a reset link has been sent.' });
    }
    // Generate token and expiry (15 min)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 1000 * 60 * 15; // 15 min
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Respond instantly (do not wait for email)
    setTimeout(async () => {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        await transporter.sendMail({
          to: user.email,
          from: process.env.EMAIL_USER,
          subject: 'Password Reset - Visiontech EMS',
          html: `<p>You requested a password reset. <a href="${resetUrl}">Click here to reset your password</a>. This link is valid for 15 minutes.</p>`
        });
      } catch (err) {
        console.error('Forgot password email error:', err);
      }
    }, 0);

    return NextResponse.json({ message: 'If your email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
