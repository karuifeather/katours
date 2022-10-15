const express = require('express');

const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signUp);
router.get('/confirmEmail/:token', authController.confirmEmail);
router.post('/login', authController.logIn);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Following paths are all protected
router.use(authController.protect);

router.get('/logout', authController.logout);
router.patch('/updatePassword', authController.updatePassword);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMyData
);
router.delete('/deleteMe', userController.deleteMyData);
router.get('/me', userController.getMe, userController.getUser);

// Following paths are all restricted to admin
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
