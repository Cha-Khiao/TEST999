import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Staff' },
  role: { type: String, default: 'staff' }, // 'admin' (ใหญ่สุด), 'staff' (จนท.ศูนย์)
  
  // --- เพิ่มตรงนี้ ---
  authorizedCenterId: { type: Schema.Types.ObjectId, ref: 'Center', default: null } 
  // ถ้าเป็น null = Admin ใหญ่ เบิกให้ใครก็ได้
  // ถ้ามี ID = เบิกเข้าศูนย์นี้ได้ที่เดียว
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);