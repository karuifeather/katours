const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
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
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    fields: ['tour', 'user'], // 'tour user'
    select: '-__v -slug -passwordChangedAt',
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
