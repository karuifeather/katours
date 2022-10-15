const express = require('express');

const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.get(
  '/check-out-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

router.use(authController.protect);

router
  .route('/')
  .get(bookingController.getBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .delete(bookingController.deleteBooking)
  .patch(bookingController.updateBooking);

module.exports = router;
