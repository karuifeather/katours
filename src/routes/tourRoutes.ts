import express from 'express';

import {
  aliasTopTours,
  createTour,
  deleteTour,
  getAllTours,
  getDistances,
  getMonthyPlan,
  getTour,
  getTourStats,
  getToursWithin,
  resizeTourImages,
  updateTour,
  uploadTourImages,
} from '../controllers/tourController';
import { protect, restrictTo } from '../controllers/authController';
import { router as reviewRouter } from './reviewRoutes';

const router = express.Router();

// router.param('id', tourController.checkID);

router.use('/:tourId/reviews', reviewRouter);

router.route('/tour-stats').get(getTourStats);

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthyPlan);

router.get('/tours-within/:distance/center/:latlng/unit/:unit', getToursWithin);

router.get('/distances/:latlng/unit/:unit', getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

export { router };
