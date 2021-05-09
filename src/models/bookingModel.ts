import mongoose from 'mongoose';
import { BookingDocument, BookingModel } from './types';

const BookingSchema = new mongoose.Schema<BookingDocument, BookingModel>({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'A booking must have a tour.'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A booking must belong to a user.'],
  },
  price: {
    type: Number,
    required: [true, 'Bookings must have price.'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

// bookingSchema.index({ tour: 1, user: 1 }, { unique: true });

BookingSchema.pre(/^find/, function (next) {
  // this.populate('user').

  this.populate({
    path: 'tour',
    select: 'name _id',
  });

  next();
});

export const Booking = mongoose.model<BookingDocument, BookingModel>(
  'Booking',
  BookingSchema
);
