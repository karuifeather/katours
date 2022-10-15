const fs = require('fs');

const multer = require('multer');
const sharp = require('sharp');

const User = require('./../models/userModel');
const catchAsyncErrors = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const handle = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination(req, file, cb) {
//     // cb kinda works like next in express
//     cb(null, 'public/img/users');
//   },
//   filename(req, file, cb) {
//     // file = req.file that comes from multer middleware
//     // user-{{user-id}}-{{timestamp}}.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image. Please upload images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsyncErrors(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await fs.unlink(`public/img/users/${req.user.photo}`, (err) => {
    if (err) next(new AppError('Upload failed. Please try again.'));
  });

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 45 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...options) => {
  const filteredObj = {};
  Object.keys(obj).forEach((curr) => {
    if (options.includes(curr)) filteredObj[curr] = obj[curr];
  });
  return filteredObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMyData = catchAsyncErrors(async (req, res, next) => {
  // 1. Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword',
        400
      )
    );
  }

  // 2. Filteres fileds that are not allowed to update
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3. Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMyData = catchAsyncErrors(async (req, res, next) => {
  await fs.unlink(`public/img/users/${req.user.photo}`, (err) => {
    if (err) next(new AppError('Delete failed. Please try again.'));
  });

  await User.findByIdAndUpdate(req.user.id, {
    active: false,
    photo: 'default.jpg',
  });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = handle.getAll(User);
exports.getUser = handle.getOne(User);
// For admins
// Do not update passwords using this
exports.updateUser = handle.updateOne(User);
exports.deleteUser = handle.deleteOne(User);

exports.createUser = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead.',
  });
};
