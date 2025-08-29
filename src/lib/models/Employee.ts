import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  user: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  avatarUrl?: string | null;
  avatarPublicId?: string | null;
  phone?: string;
  department: string;
  position: string;
  salary: number;
  hireDate: Date;
  employmentType?: 'full_time' | 'part_time' | 'intern' | 'contract';
  status?: 'active' | 'inactive' | 'probation' | 'resigned';
  manager?: mongoose.Types.ObjectId | null;
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
  documents?: {
    type: string; // e.g., id_proof, contract, certificate
    url: string;
    uploadedAt: Date;
    expiryDate?: Date;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    notes?: string;
  }[];
  workLocation?: 'onsite' | 'remote' | 'hybrid';
  shift?: {
    name?: string;
    startTime?: string; // HH:mm
    endTime?: string;   // HH:mm
  };
  contractEndDate?: Date;
  transferHistory?: {
    fromDepartment?: string;
    toDepartment: string;
    reason?: string;
    transferredAt: Date;
  }[];
  exitInfo?: {
    resignationReason?: string;
    lastWorkingDay?: Date;
    clearanceStatus?: 'pending' | 'in_progress' | 'completed';
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
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  dateOfBirth: {
    type: Date
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
  employmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'intern', 'contract']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'probation', 'resigned'],
    default: 'active'
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
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
  documents: [{
    type: {
      type: String,
      trim: true
    },
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    expiryDate: Date,
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    notes: String
  }],
  workLocation: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid']
  },
  shift: {
    name: String,
    startTime: String,
    endTime: String
  },
  contractEndDate: {
    type: Date
  },
  transferHistory: [{
    fromDepartment: String,
    toDepartment: { type: String, required: true },
    reason: String,
    transferredAt: { type: Date, default: Date.now }
  }],
  exitInfo: {
    resignationReason: String,
    lastWorkingDay: Date,
    clearanceStatus: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' }
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

// Helpful indexes
employeeSchema.index({ firstName: 1, lastName: 1 });
employeeSchema.index({ email: 1 }, { unique: false });
employeeSchema.index({ department: 1 });
employeeSchema.index({ position: 1 });
employeeSchema.index({ status: 1 });

export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', employeeSchema);
