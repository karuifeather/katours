const stripe = require('stripe')(process.env.STRIPE_SECRET);

const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsyncErrors = require('./../utils/catchAsync');
const handle = require('./handlerFactory');

exports.getBooking = handle.getOne(Booking);
exports.getBookings = handle.getAll(Booking);
exports.deleteBooking = handle.deleteOne(Booking);
exports.createBooking = handle.createOne(Booking);
exports.updateBooking = handle.updateOne(Booking);

exports.getCheckoutSession = catchAsyncErrors(async (req, res, next) => {
  // 1. Get the tour
  const tour = await Tour.findById(req.params.tourId);

  // 2. Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/overview?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: `${tour.summary}`,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3. Create chekout session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsyncErrors(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});
