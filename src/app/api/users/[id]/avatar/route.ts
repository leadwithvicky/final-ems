import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

// Save to local public folder for now: /public/uploads/avatars
import Employee from '@/lib/models/Employee';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only self or admin/superadmin can update
    const isSelf = decoded.id === params.id;
    const isPrivileged = decoded.role === 'admin' || decoded.role === 'superadmin';
    if (!isSelf && !isPrivileged) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Basic validations
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || '';
    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
    }

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: file.type }), `${params.id}-avatar`);
    form.append('upload_preset', uploadPreset);
    form.append('folder', 'ems/avatars');

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form
    });
    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok) {
      return NextResponse.json({ error: uploadJson?.error?.message || 'Cloudinary upload failed' }, { status: 500 });
    }
    const uploaded = { secure_url: uploadJson.secure_url as string, public_id: uploadJson.public_id as string };

    // Update User
    const user = await User.findByIdAndUpdate(
      params.id,
      { avatarUrl: uploaded.secure_url, avatarUpdatedAt: new Date() },
      { new: true }
    );
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Also update Employee document if exists
    await Employee.findOneAndUpdate(
      { user: params.id },
      { avatarUrl: uploaded.secure_url, avatarPublicId: uploaded.public_id },
      { new: true }
    );
    return NextResponse.json({ avatarUrl: uploaded.secure_url, avatarUpdatedAt: user.avatarUpdatedAt });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}


