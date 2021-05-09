import mongoose from 'mongoose';

import { Tour } from './tourModel';
import { ReviewDocument, ReviewModel } from './types';

const ReviewSchema = new mongoose.Schema<ReviewDocument, ReviewModel>(
  {
    review: {
      type: String,
      trim: true,
      required: [true, 'A review cannot be empty.'],
    },
    rating: {
      type: Number,
      required: [true, 'A review must have a rating.'],
      min: [1, 'A review cannot have rating below 1.'],
      max: [5, 'A review cannot be more than 5.'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ReviewSchema.index({ tour: 1, user: 1 }, { unique: true });

ReviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

ReviewSchema.statics.calcAvgRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length !== 0) {
    // Persist the stats in tour doc by that tourId
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

ReviewSchema.post<ReviewDocument>('save', function () {
  // this points to the current doc
  // @ts-ignore
  this.constructor.calcAvgRatings(this.tour);
});

// findByIdAndUpdate
// findbyIdAndDelete
ReviewSchema.post(/^findOneAnd/, async function (doc, next) {
  if (!doc) {
    next();
  }
  await doc.constructor.calcAvgRatings(doc.tour);

  next();
});

export const Review = mongoose.model<ReviewDocument, ReviewModel>(
  'Review',
  ReviewSchema
);
