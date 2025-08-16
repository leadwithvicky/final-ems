import mongoose, { Document, Schema } from 'mongoose';

export interface ILeave extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'emergency';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedDate: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedDate?: Date;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>({
  employee: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['annual', 'sick', 'personal', 'maternity', 'paternity', 'emergency'],
    required: [true, 'Leave type is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  days: {
    type: Number,
    required: [true, 'Number of days is required'],
    min: 0.5
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: {
    type: Date
  },
  comments: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Validate that end date is after start date
leaveSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

// Calculate days automatically
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    this.days = diffDays;
  }
  next();
});

export default mongoose.models.Leave || mongoose.model<ILeave>('Leave', leaveSchema);
