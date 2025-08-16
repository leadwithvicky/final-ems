import mongoose, { Schema, Document } from 'mongoose';

export interface IPayroll extends Document {
  employeeId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  basicSalary: number;
  allowances: {
    housing: number;
    transport: number;
    meal: number;
    other: number;
  };
  deductions: {
    tax: number;
    insurance: number;
    pension: number;
    other: number;
  };
  overtime: number;
  bonus: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paymentDate?: Date;
  payslipUrl?: string;
  notes?: string;
  processedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const payrollSchema = new Schema<IPayroll>({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: {
    housing: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    meal: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    tax: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    pension: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  overtime: {
    type: Number,
    default: 0
  },
  bonus: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    required: true
  },
  totalDeductions: {
    type: Number,
    required: true
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  payslipUrl: {
    type: String
  },
  notes: {
    type: String
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for employee, month, and year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Calculate totals before saving
payrollSchema.pre('save', function(next) {
  const allowances = this.allowances.housing + this.allowances.transport + 
                   this.allowances.meal + this.allowances.other;
  
  const deductions = this.deductions.tax + this.deductions.insurance + 
                   this.deductions.pension + this.deductions.other;
  
  this.totalEarnings = this.basicSalary + allowances + this.overtime + this.bonus;
  this.totalDeductions = deductions;
  this.netSalary = this.totalEarnings - this.totalDeductions;
  
  next();
});

export default mongoose.models.Payroll || mongoose.model<IPayroll>('Payroll', payrollSchema);
