import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  clockIn: Date;
  clockOut?: Date;
  totalHours?: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  clockIn: {
    type: Date,
    required: true
  },
  clockOut: {
    type: Date
  },
  totalHours: {
    type: Number
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'present'
  },
  notes: {
    type: String
  },
  location: {
    latitude: Number,
    longitude: Number
  }
}, {
  timestamps: true
});

// Compound index for employee and date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Calculate total hours when clockOut is set
attendanceSchema.pre('save', function(next) {
  if (this.clockOut && this.clockIn) {
    const diffMs = this.clockOut.getTime() - this.clockIn.getTime();
    this.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }
  next();
});

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', attendanceSchema);
