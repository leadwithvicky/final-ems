import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  user: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  phone?: string;
  department: string;
  position: string;
  salary: number;
  hireDate: Date;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  isActive: boolean;
  totalLeaves: number;
  usedLeaves: number;
  fullName: string;
  remainingLeaves: number;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  avatarUrl: {
    type: String,
    default: null
  },
  avatarPublicId: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: 0
  },
  hireDate: {
    type: Date,
    required: [true, 'Hire date is required']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalLeaves: {
    type: Number,
    default: 18
  },
  usedLeaves: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for remaining leaves
employeeSchema.virtual('remainingLeaves').get(function() {
  return this.totalLeaves - this.usedLeaves;
});

// Ensure virtual fields are serialized
employeeSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', employeeSchema);
