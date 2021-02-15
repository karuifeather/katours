const express = require('express');

const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

// GET /tours/1431jh4523jk1/reviews
// POST /tours/1431jh4523jk1/reviews
// GET /tours/1431jh4523jk1/reviews/12g431jh3415g

// /reviews

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

module.exports = router;
