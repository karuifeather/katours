import express from 'express';

import { protect } from '../controllers/authController';
import {
  createBooking,
  deleteBooking,
  getBookings,
  getCheckoutSession,
  updateBooking,
  getBooking,
} from '../controllers/bookingController';

const router = express.Router();

router.get('/check-out-session/:tourId', protect, getCheckoutSession);

router.use(protect);

router.route('/').get(getBookings).post(createBooking);

router.route('/:id').get(getBooking).delete(deleteBooking).patch(updateBooking);

export { router };
