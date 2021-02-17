const Tour = require('../models/tourModel');
const catchAsyncErrors = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsyncErrors(async (req, res) => {
  // 1. Get tour data from collection
  const tours = await Tour.find();

  // 2. Build template
  // 3. Render template using tour data
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsyncErrors(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = catchAsyncErrors(async (req, res) => {
  res.status(200).render('login', {
    title: 'Login to your account',
  });
});

exports.getSignupForm = catchAsyncErrors(async (req, res) => {
  let email, name;
  if (req.query.email && req.query.fullname) {
    email = req.query.email;
    name = req.query.fullname;
  } else {
    email = '';
    name = '';
  }

  res.status(200).render('signup', {
    title: 'Signup for a new account',
    name,
    email,
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My Profile',
  });
};
