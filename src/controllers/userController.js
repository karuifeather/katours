const User = require('./../models/userModel');
const catchAsyncErrors = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const handle = require('./handlerFactory');

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
  await User.findByIdAndUpdate(req.user.id, { active: false });

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
