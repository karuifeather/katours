const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('./../models/userModel');
const catchAsyncErrors = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_PRIVATE, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  // Remove password from the object
  user.password = undefined;

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsyncErrors(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // 2 Generate the random confirm token
  const confrimToken = newUser.createConfirmToken();
  await newUser.save({ validateBeforeSave: false });

  // 3 Send it to user's email
  const confrimTokenUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/confirmEmail/${confrimToken}`;

  /*lost sendgrid account*/

  // await new Email(
  //   { name: newUser.name, email: newUser.email },
  //   confrimTokenUrl
  // ).sendConfirmEmail();

  newUser.active = undefined;

  createSendToken(newUser, 201, req, res);
});

exports.confirmEmail = catchAsyncErrors(async (req, res, next) => {
  // 1 Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const newUser = await User.findOne({
    accountConfirmToken: hashedToken,
  });

  if (!newUser)
    return res.status(400).render('alert', {
      alertMessage:
        'Either the token is invalid or your account has already been verified!',
      alertType: 'error',
      title: 'Verification failed',
      user: {},
    });

  // 2 Prepare to welcome the newUser
  newUser.accountConfirmToken = undefined;
  newUser.accountExpiresIn = undefined;
  newUser.active = true;

  await newUser.save({ validateBeforeSave: false });

  // 3 Send welcome email
  // const url = `${req.protocol}://${req.get('host')}/me`;
  // await new Email(
  //   { name: newUser.name, email: newUser.email },
  //   url
  // ).sendWelcomeEmail();

  // For some unknown reason, current user was assigned to res.locals
  // and was causing rendering bugs so to solve it, I manually supplied
  // empty user object in render options

  res.status(200).render('alert', {
    alertMessage: 'Your account has been successfully verified!',
    alertType: 'success',
    title: 'Email Confirmation',
    user: {},
  });
});

exports.logIn = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // 1 If email and password don't exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2 If email user exists && password is correct
  // + is needed because select in password is set to false. See user model.
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3 If everything is ok, send token to client
  createSendToken(user, 200, req, res);
});

exports.protect = catchAsyncErrors(async (req, res, next) => {
  // 1 Get token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("You're not logged in. Log in to continue.", 401));
  }

  // 2 Verification of token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_PRIVATE);

  // 3 Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists!', 401)
    );
  }

  // 4 Check if user changed password after token was issued
  if (currentUser.changedPasswordAfterIssueing(decoded.iat)) {
    return next(
      new AppError(
        'Your password was changed recently. Log in with new password and try again.',
        401
      )
    );
  }

  // Grant access to the protected route
  res.locals.user = currentUser;
  req.user = currentUser;
  next();
});

// ONLY FOR RENDERED PAGES SO NO ERRORS
exports.isLoggedIn = async (req, res, next) => {
  // Check for token
  if (req.cookies.jwt) {
    try {
      // 2 Verification of token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_PRIVATE
      );

      // 3 Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4 Check if user changed password after token was issued
      if (currentUser.changedPasswordAfterIssueing(decoded.iat)) {
        return next();
      }

      // Conclusion: There is a logged in valid user
      res.locals.user = currentUser;
      return next();
    } catch (e) {
      return next();
    }
  }

  next();
};

exports.logout = (req, res) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  };

  res.cookie('jwt', 'loggedout', cookieOptions);

  res.status(200).json({
    status: 'success',
  });
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action", 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  if (!req.body.email) {
    return next(new AppError('Please first provide an email address!', 404));
  }

  // 1 Get user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('No user exits with the given email address.', 404)
    );
  }

  // 2 Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3 Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await new Email(user, resetURL).sendResetTokenEmail();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresIn = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the reset email. Try again later!',
        500
      )
    );
  }
});
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // 1 Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresIn: { $gt: Date.now() },
  });

  // 2 If token has not expired and there is user, set new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresIn = undefined;
  await user.save();

  // 3 Update changedPasswordAt property for the user
  // Done by middleware. See userModel.js

  // 4 Log the user in and send JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. check if POSTed current password is correct
  const pass = await user.correctPassword(
    req.body.passwordCurrent,
    user.password
  );
  if (!pass) {
    return next(new AppError('Try again with correct password.', 401));
  }

  // 3. If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4. log user in, send JWT
  createSendToken(user, 200, req, res);
});
