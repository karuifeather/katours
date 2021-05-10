import { Tour } from '../models/tourModel';
import { Booking } from '../models/bookingModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const alert = (req, res, next) => {
  const { alert } = req.query;

  if (alert === 'booking') {
    res.locals.alert =
      "Your booking was successful! Please check your email for confirmation. If your booking doesn't show up here immediately, please come here later again!";
  }

  next();
};

export const getOverview = catchAsync(async (req, res) => {
  // 1. Get tour data from collection
  const tours = await Tour.find();

  // 2. Build template
  // 3. Render template using tour data
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

export const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  res.status(200).render('tour', {
    // @ts-ignore
    title: `${tour.name} Tour`,
    tour,
  });
});

export const getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Login to your account',
  });
});

export const getSignupForm = catchAsync(async (req, res) => {
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

export const getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My Profile',
  });
};

export const getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });
  // @ts-ignore
  const tourIds = bookings.map((booking) => booking.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My bookings',
    tours,
  });
});
