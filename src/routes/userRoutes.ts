import express from 'express';

import {
  createUser,
  deleteMyData,
  deleteUser,
  getAllUsers,
  getMe,
  getUser,
  resizeUserPhoto,
  updateMyData,
  updateUser,
  uploadUserPhoto,
} from '../controllers/userController';
import {
  confirmEmail,
  forgotPassword,
  logIn,
  logout,
  protect,
  resetPassword,
  restrictTo,
  signUp,
  updatePassword,
} from '../controllers/authController';

const router = express.Router();

router.post('/signup', signUp);
router.get('/confirmEmail/:token', confirmEmail);
router.post('/login', logIn);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// Following paths are all protected
router.use(protect);

router.get('/logout', logout);
router.patch('/updatePassword', updatePassword);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMyData);
router.delete('/deleteMe', deleteMyData);
router.get('/me', getMe, getUser);

// Following paths are all restricted to admin
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export { router };
