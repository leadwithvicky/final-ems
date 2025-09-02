import mongoose, { Schema, Document } from 'mongoose';

export interface IPollResponse extends Document {
  pollId: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId; // omitted if anonymous
  answer: string | number; // text, option value, rating 1-5
  createdAt: Date;
  updatedAt: Date;
}

const pollResponseSchema = new Schema<IPollResponse>({
  pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  answer: { type: Schema.Types.Mixed, required: true }
}, { timestamps: true });

// Enforce one response per employee per poll (anonymous responses can be multiple)
pollResponseSchema.index({ pollId: 1, employeeId: 1 }, { unique: true, partialFilterExpression: { employeeId: { $type: 'objectId' } } });

export default mongoose.models.PollResponse || mongoose.model<IPollResponse>('PollResponse', pollResponseSchema);


