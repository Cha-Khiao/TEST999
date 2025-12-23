// src/models/Transaction.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  type: 'IN' | 'OUT'; // IN = รับบริจาค, OUT = เบิกจ่ายให้ศูนย์
  itemId: mongoose.Types.ObjectId;
  centerId?: mongoose.Types.ObjectId; // ถ้าเป็นการเบิก ต้องระบุว่าไปศูนย์ไหน
  quantity: number;
  donorName?: string; // ชื่อผู้บริจาค (กรณีรับเข้า)
  requesterName?: string; // ชื่อผู้เบิก (กรณีเบิกออก)
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

const TransactionSchema: Schema = new Schema({
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  centerId: { type: Schema.Types.ObjectId, ref: 'Center' },
  quantity: { type: Number, required: true },
  donorName: { type: String },
  requesterName: { type: String },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);