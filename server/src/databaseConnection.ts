import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export function connectDatabase() {
  mongoose
    .connect(process.env.MONGODB_URL as string)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));
}
