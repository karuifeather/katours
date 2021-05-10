import express from 'express';
import { protect, restrictTo } from '../controllers/authController';
import {
  createReview,
  deleteReview,
  getAllReviews,
  getReview,
  setsTourUserIds,
  updateReview,
} from '../controllers/reviewController';

const router = express.Router({ mergeParams: true });

// GET /tours/1431jh4523jk1/reviews
// POST /tours/1431jh4523jk1/reviews
// GET /tours/1431jh4523jk1/reviews/12g431jh3415g
// /reviews

// Following paths are all protected
router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setsTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

export { router };
