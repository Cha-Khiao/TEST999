// src/models/Center.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICenter extends Document {
  name: string;
  location?: string;
  district: string;
  subdistrict?: string;
  phoneNumbers: string[];
  capacity?: number;
  status: 'active' | 'inactive';
  shelterType?: string;
  contactPerson?: string;
  type: 'DONATION_POINT' | 'SHELTER';
}

const CenterSchema: Schema = new Schema({
  name: { type: String, required: true },
  location: { type: String },
  district: { type: String, required: true },
  subdistrict: { type: String },
  phoneNumbers: [{ type: String }],
  capacity: { type: Number },
  status: { type: String, default: 'active' },
  shelterType: { type: String },
  contactPerson: { type: String },

  type: {
    type: String,
    enum: ['DONATION_POINT', 'SHELTER'],
    default: 'SHELTER'
  }
}, { timestamps: true });

// Check if the model is already compiled to avoid OverwriteModelError
const Center = mongoose.models.Center || mongoose.model<ICenter>('Center', CenterSchema);

export default Center;