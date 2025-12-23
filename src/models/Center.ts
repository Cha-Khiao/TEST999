// src/models/Center.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICenter extends Document {
  name: string;
  location?: string;
  district?: string;
  subdistrict?: string;
  capacity?: number;
  capacityStatus?: string;
  shelterType?: string;
  phoneNumbers?: string[];
  status: string;
}

const CenterSchema: Schema = new Schema({
  name: { type: String, required: true },
  location: { type: String },
  district: { type: String },
  subdistrict: { type: String },
  capacity: { type: Number },
  capacityStatus: { type: String },
  shelterType: { type: String },
  phoneNumbers: { type: [String] },
  status: { type: String, default: 'active' },
}, { timestamps: true });

export default mongoose.models.Center || mongoose.model<ICenter>('Center', CenterSchema);