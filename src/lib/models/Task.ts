import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  department?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate: Date;
  completedDate?: Date;
  progress: number; // 0-100
  tags: string[];
  attachments?: string[];
  comments: {
    employeeId: mongoose.Types.ObjectId;
    comment: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  department: {
    type: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tags: [{
    type: String
  }],
  attachments: [{
    type: String
  }],
  comments: [{
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee'
    },
    comment: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ department: 1, status: 1 });
taskSchema.index({ dueDate: 1 });

export default mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);
