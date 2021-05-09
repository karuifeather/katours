import Stripe from 'stripe';

import { Tour } from '../models/tourModel';
import { User } from '../models/userModel';
import { Booking } from '../models/bookingModel';
import { catchAsync } from '../utils/catchAsync';
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory';

export const getBooking = getOne(Booking);
export const getBookings = getAll(Booking);
export const deleteBooking = deleteOne(Booking);
export const createBooking = createOne(Booking);
export const updateBooking = updateOne(Booking);

const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: '2020-08-27',
  typescript: true,
});

export const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get the tour
  const tour = await Tour.findById(req.params.tourId);

  // 2. Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/overview?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: `${tour.summary}`,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
        ],
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

const createBookingCheckout = async (sessionData) => {
  const tour = sessionData.client_reference_id;
  const user = await User.findOne({
    email: sessionData.customer_details.email,
  });
  const userId = user._id;
  const price = sessionData.amount_total / 100;

  await Booking.create({ tour, user: userId, price });
};

export const webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    // event = JSON.parse(req.body);
  } catch (e) {
    // to Stripe
    return res.status(400).send(`Webhook error: ${e}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

// export const createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split('?')[0]);
// });
