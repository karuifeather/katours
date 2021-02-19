const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'A booking must have a tour.'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A booking belong to a user.'],
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

bookingSchema.index({ tour: 1, user: 1 }, { unique: true });

bookingSchema.pre(/^find/, function (next) {
  // this.populate('user').

  this.populate({
    path: 'tour',
    select: 'name _id',
  });

  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
