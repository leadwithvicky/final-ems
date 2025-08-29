import { NextRequest, NextResponse } from 'next/server';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Please provide name, email and password' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const user = new User({ 
      name, 
      email, 
      password, 
      role: 'employee' 
    });
    await user.save();

    const secret: Secret = (process.env.JWT_SECRET || 'fallback-secret') as Secret;
    const signOptions: SignOptions = { expiresIn: (process.env.JWT_EXPIRE as any) || '7d' };
    const token = jwt.sign({ id: user._id, role: user.role }, secret, signOptions);

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}
