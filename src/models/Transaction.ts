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
    proofUrl?: string; // หลักฐานการเบิก (รูปภาพ/เอกสาร)
    rejectionReason?: string; // เหตุผลที่ปฏิเสธ
    contactPhone?: string;
    isPickupRequired?: boolean;
    pickupLocation?: string;
    approverName?: string; // ชื่อผู้อนุมัติ/ผู้รับของ
    groupId?: string; // Group ID for bulk transactions
}

const TransactionSchema: Schema = new Schema({
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    centerId: { type: Schema.Types.ObjectId, ref: 'Center' },
    quantity: { type: Number, required: true },
    donorName: { type: String },
    requesterName: { type: String },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
    proofUrl: { type: String },
    rejectionReason: { type: String },
    contactPhone: { type: String },
    isPickupRequired: { type: Boolean, default: false },
    pickupLocation: { type: String },
    approverName: { type: String },
    groupId: { type: String },
}, { timestamps: true });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);