import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/advancedems';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: typeof import('mongoose') | null; promise: Promise<typeof import('mongoose')> | null } | undefined;
}

let cached = global.mongoose as { conn: typeof import('mongoose') | null; promise: Promise<typeof import('mongoose')> | null } | undefined;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null } as any;
}

async function dbConnect() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached = cached || (global.mongoose as any);
    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached!.conn = await (cached as any).promise;
  } catch (e) {
    if (cached) cached.promise = null as any;
    throw e;
  }

  return cached!.conn;
}

export const connectDB = dbConnect;
export default dbConnect;
