import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Payroll from '@/lib/models/Payroll';
import Employee from '@/lib/models/Employee';
import User from '@/lib/models/User';
import Notification from '@/lib/models/Notification';
import nodemailer from 'nodemailer';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ message: 'No token provided' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const payroll = await Payroll.findById(params.id).populate('employeeId', 'firstName lastName email user');
    if (!payroll) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    payroll.status = 'paid';
    payroll.paymentDate = new Date();
    await payroll.save();

    // Notify employee by email and in-app notification (best-effort; don't fail the request if these fail)
    try {
      const emp: any = payroll.employeeId;
      // Find user linked to employee by email
      const user = await User.findOne({ email: emp?.email });

      // In-app notification
      if (user) {
        await Notification.create({
          userId: user._id,
          type: 'success',
          title: 'Salary Paid',
          message: `Your salary for ${payroll.month}/${payroll.year} has been credited. Net: ₹${(payroll.netSalary || 0).toLocaleString('en-IN')}`,
        });
      }

      // Email (uses environment SMTP settings)
      const host = process.env.SMTP_HOST;
      const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
      const userEmail = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (host && userEmail && pass && emp?.email) {
        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user: userEmail, pass }
        });
        await transporter.sendMail({
          from: `Payroll <${userEmail}>`,
          to: emp.email,
          subject: `Salary Paid - ${new Date(payroll.year, payroll.month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
          html: `<p>Hi ${emp.firstName || 'there'},</p>
                 <p>Your salary for <strong>${new Date(payroll.year, payroll.month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</strong> has been credited.</p>
                 <p><strong>Net Amount:</strong> ₹${(payroll.netSalary || 0).toLocaleString('en-IN')}</p>
                 <p>Thank you,<br/>VisionTech Payroll</p>`
        });
      }
    } catch (notifyErr) {
      console.error('Post-pay notifications failed:', notifyErr);
    }

    return NextResponse.json({ message: 'Marked as paid' });
  } catch (error) {
    console.error('Error marking payroll paid:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


