import mongoose, { Document, Model } from 'mongoose';

export type UserRoles = 'user' | 'guide' | 'lead-guide' | 'admin';

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
  bookings?: any;
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfterIssueing(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
  createConfirmToken(): string;
}

export interface UserModel extends Model<UserDocument> {}

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
  durationWeeks: number;
  reviews?: any;
  guides: mongoose.Schema.Types.ObjectId[];
}

export interface TourModel extends Model<TourDocument> {}

export interface ReviewDocument extends Document {
  review: string;
  rating: number;
  createdAt: number;
  tour: mongoose.Schema.Types.ObjectId;
  user: mongoose.Schema.Types.ObjectId;
}

export interface ReviewModel extends Model<ReviewDocument> {
  calcAvgRatings(tourId: string): Promise<void>;
}

export interface BookingDocument extends Document {
  tour: mongoose.Schema.Types.ObjectId;
  user: mongoose.Schema.Types.ObjectId;
  price: number;
  createdAt: number;
  paid: string;
}

export interface BookingModel extends Model<BookingDocument> {}
