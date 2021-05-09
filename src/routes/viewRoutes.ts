import express from 'express';
import {
  getAccount,
  getLoginForm,
  getMyTours,
  getOverview,
  getSignupForm,
} from '../controllers/viewController';
import { isLoggedIn, protect } from '../controllers/authController';
import { getTour } from '../controllers/tourController';

const router = express.Router();

router.get('/me', protect, getAccount);

router.use(alert, isLoggedIn);

router.get('/overview', getOverview);
router.get('/tour/:slug', getTour);
router.get('/login', getLoginForm);
router.get('/signup', getSignupForm);
router.get('/my-tours', protect, getMyTours);

module.exports = router;
