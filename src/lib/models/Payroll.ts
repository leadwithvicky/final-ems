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
  status: 'pending' | 'processed' | 'paid' | 'finalized';
  paymentDate?: Date;
  payslipUrl?: string;
  notes?: string;
  processedBy: mongoose.Types.ObjectId;
  // Audit fields
  recomputedBy?: mongoose.Types.ObjectId;
  recomputedAt?: Date;
  recomputeReason?: string;
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
    enum: ['pending', 'processed', 'paid', 'finalized'],
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
  },
  // Audit fields for recompute tracking
  recomputedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Employee'
  },
  recomputedAt: {
    type: Date
  },
  recomputeReason: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for employee, month, and year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Calculate totals before validation so required fields are present
payrollSchema.pre('validate', function(next) {
  const safeNumber = (v: any) => (typeof v === 'number' && !isNaN(v) ? v : 0);

  const a = this.allowances || { housing: 0, transport: 0, meal: 0, other: 0 };
  const d = this.deductions || { tax: 0, insurance: 0, pension: 0, other: 0 };

  const allowances = safeNumber(a.housing) + safeNumber(a.transport) + safeNumber(a.meal) + safeNumber(a.other);
  const deductions = safeNumber(d.tax) + safeNumber(d.insurance) + safeNumber(d.pension) + safeNumber(d.other);

  const basic = safeNumber(this.basicSalary);
  const overtime = safeNumber(this.overtime);
  const bonus = safeNumber(this.bonus);

  this.totalEarnings = basic + allowances + overtime + bonus;
  this.totalDeductions = deductions;
  this.netSalary = this.totalEarnings - this.totalDeductions;

  next();
});

// In dev, Next can hot-reload without process restart; ensure latest schema hooks apply
if (mongoose.models.Payroll) {
  delete mongoose.models.Payroll;
}
export default mongoose.model<IPayroll>('Payroll', payrollSchema);
