import fs from 'fs';

import multer from 'multer';
import sharp from 'sharp';

import { User } from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { getOne, getAll, updateOne, deleteOne } from './handlerFactory';

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

export const uploadUserPhoto = upload.single('photo');

export const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await fs.unlink(`public/img/users/${req.user.photo}`, (err) => {
    if (err) next(new AppError('Upload failed. Please try again.', 500));
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

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const updateMyData = catchAsync(async (req, res, next) => {
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
  // @ts-ignore
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

export const deleteMyData = catchAsync(async (req, res, next) => {
  await fs.unlink(`public/img/users/${req.user.photo}`, (err) => {
    if (err) next(new AppError('Delete failed. Please try again.', 500));
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

export const getAllUsers = getAll(User);
export const getUser = getOne(User);
// For admins
// Do not update passwords using this
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);

export const createUser = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead.',
  });
};
