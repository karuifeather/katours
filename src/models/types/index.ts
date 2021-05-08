import mongoose, { Document } from 'mongoose';

type UserRoles = 'user' | 'guide' | 'lead-guide' | 'admin';

export interface UserDocument extends Document {
  name: string;
  slug: string;
  email: string;
  photo?: string;
  role: UserRoles;
  password: string;
  passwordConfirm: string;
  passwordChangedAt?: number;
  accountConfirmToken?: string;
  accountExpiresIn?: number;
  passwordResetToken?: string;
  passwordResetExpiresIn?: number;
  active: boolean;
}

export interface TourDocument extends Document {
  name: string;
  slug: string;
  duration: number;
  maxGroupSize: number;
  difficulty: 'easy' | 'medium' | 'difficult';
  ratingsAverage: number;
  ratingsQuantity: number;
  price: number;
  priceDiscount: number;
  summary: string;
  description: string;
  imageCover: string;
  images: string[];
  createdAt: number;
  startDates: number[];
  secretTour: boolean;
  startLocation: any;
  locations: any[];
  guides: mongoose.Schema.Types.ObjectId[];
}
