const Review = require('./../models/reviewModel');
const AppError = require('./../utils/appError');

const catchAsyncErrors = require('./../utils/catchAsync');

exports.getAllReviews = catchAsyncErrors(async (req, res, next) => {
  let filter = {};

  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsyncErrors(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const review = await Review.create(req.body);

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});
