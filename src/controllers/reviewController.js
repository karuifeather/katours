const Review = require('./../models/reviewModel');
const AppError = require('./../utils/appError');

const catchAsyncErrors = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

exports.getAllReviews = catchAsyncErrors(async (req, res, next) => {
  const features = new APIFeatures(Review.find(), req.query)
    .filter()
    .sort()
    .projectFields()
    .paginate();

  const reviews = await features.query;

  res.status(200).json({
    status: 'success',
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsyncErrors(async (req, res, next) => {
  const review = await Review.create(req.body);

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});
