import mongoose, { Schema, Document } from 'mongoose';

export type PollType = 'mcq' | 'yesno' | 'rating' | 'text';
export type PollStatus = 'active' | 'closed';

export interface IPoll extends Document {
  question: string;
  type: PollType;
  options?: string[]; // for mcq/yesno
  isAnonymousAllowed: boolean;
  createdBy: mongoose.Types.ObjectId;
  status: PollStatus;
  createdAt: Date;
  updatedAt: Date;
}

const pollSchema = new Schema<IPoll>({
  question: { type: String, required: true, maxlength: 500 },
  type: { type: String, enum: ['mcq','yesno','rating','text'], required: true },
  options: [{ type: String }],
  isAnonymousAllowed: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active','closed'], default: 'active' }
}, { timestamps: true });

pollSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Poll || mongoose.model<IPoll>('Poll', pollSchema);


