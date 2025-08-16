import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as any;
  } catch (error) {
    return null;
  }
};

export const generateToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};
