// src/models/Item.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  name: string;
  quantity: number;
  unit: string; // เช่น แพ็ค, ขวด, กิโลกรัม
  category: string; // อาหาร, ยา, เครื่องนุ่งห่ม
}

const ItemSchema: Schema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  category: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);