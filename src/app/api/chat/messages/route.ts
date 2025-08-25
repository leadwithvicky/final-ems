import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/db';
import ChatMessage from '@/lib/models/ChatMessage';
import { isRedisConfigured, redisGetJson, redisSetJson, redisDel } from '@/lib/redis';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get token from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const before = searchParams.get('before');

    const query: any = { isDeleted: false };
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const cacheKey = isRedisConfigured() ? `chat:messages:${limit}:${before || 'latest'}` : null;
    if (cacheKey) {
      const cached = await redisGetJson<any[]>(cacheKey);
      if (cached) {
        return NextResponse.json({ messages: cached });
      }
    }

    const messages = await ChatMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('senderId', 'name role avatarUrl avatarUpdatedAt');

    const result = messages.reverse();
    if (cacheKey) {
      await redisSetJson(cacheKey, result, 2); // short TTL to reduce load while polling
    }
    return NextResponse.json({ messages: result });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get token from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { message } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const chatMessage = new ChatMessage({
      senderId: user._id,
      senderRole: user.role,
      senderName: user.name,
      message: message.trim()
    });

    await chatMessage.save();
    await chatMessage.populate('senderId', 'name role avatarUrl avatarUpdatedAt'); // ✅ Ensure senderId is populated
    // Invalidate caches
    if (isRedisConfigured()) {
      await redisDel('chat:messages:50:latest');
      await redisDel('chat:messages:100:latest');
    }
    return NextResponse.json({ message: chatMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
