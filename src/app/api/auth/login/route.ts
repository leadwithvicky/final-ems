import { NextRequest, NextResponse } from 'next/server';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Please provide email and password' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Account is deactivated' },
        { status: 403 }
      );
    }

    const secret: Secret = (process.env.JWT_SECRET || 'fallback-secret') as Secret;
    const signOptions: SignOptions = { expiresIn: (process.env.JWT_EXPIRE as any) || '7d' };
    const token = jwt.sign({ id: user._id, role: user.role }, secret, signOptions);

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        avatarUrl: user.avatarUrl || null,
        avatarUpdatedAt: user.avatarUpdatedAt ? user.avatarUpdatedAt.toISOString() : null
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
