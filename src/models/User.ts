// src/models/User.ts
import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // จะเก็บแบบ Hash
  name: { type: String, default: 'Admin' },
  role: { type: String, default: 'admin' },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);