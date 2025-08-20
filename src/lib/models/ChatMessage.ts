import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  senderRole: 'employee' | 'admin' | 'superadmin';
  senderName: string;
  message: string;
  timestamp: Date;
  isDeleted?: boolean;
  editedAt?: Date;
}

const ChatMessageSchema: Schema = new Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  senderRole: { 
    type: String, 
    enum: ['employee', 'admin', 'superadmin'], 
    required: true 
  },
  senderName: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true, 
    maxlength: 1000,
    trim: true
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  editedAt: { 
    type: Date 
  }
});

ChatMessageSchema.index({ timestamp: 1 });
ChatMessageSchema.index({ senderId: 1 });

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
