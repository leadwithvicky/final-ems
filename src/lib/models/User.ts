import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'admin' | 'superadmin';
  employeeId?: string;
  isActive: boolean;
  mustChangePassword: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['employee', 'admin', 'superadmin'],
    default: 'employee'
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate employee ID and set mustChangePassword for new employees
userSchema.pre('save', function(next) {
  if (this.isNew && !this.employeeId) {
    this.employeeId = 'EMP' + Date.now().toString().slice(-6);
  }
  if (this.isNew && this.role === 'employee') {
    this.mustChangePassword = true;
  }
  next();
});

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
