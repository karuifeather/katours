const crypto = require('crypto');
const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A name must be given'],
      trim: true,
      minlength: [6, 'A name must be atleast 6 characters long'],
    },
    slug: { type: String, select: false },
    email: {
      type: String,
      required: [true, 'An email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: 'Email is invalid',
      },
    },
    photo: {
      type: String,
      trim: true,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be atleast 8 characters long'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Confirmation password is required'],
      validate: {
        // This only works on SAVE
        validator: function (val) {
          return this.password === val;
        },
        message: 'Passwords must match',
      },
    },
    passwordChangedAt: Date,
    accountConfirmToken: String,
    accountExpiresIn: Date,
    passwordResetToken: String,
    passwordResetExpiresIn: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
  }
);

userSchema.virtual('bookings', {
  ref: 'Booking',
  foreignField: 'user',
  localField: '_id',
});

userSchema.pre('save', async function (next) {
  // Run the function if password was changed
  if (!this.isModified('password')) {
    return next();
  }

  // Hash the password with cost of 14
  this.password = await bcrypt.hash(this.password, 14);
  // Delete the confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (this.isNew || !this.isModified('password')) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } }).populate('bookings');
  // .select('-__v -passwordChangedAt -slug');
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfterIssueing = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // First convert the date to milliseconds using getTime()
    // Then convert to seconds by / 1000 => Parse it
    // Finally compare
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(18).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpiresIn = Date.now() + 15 * 60 * 1000; // 15 mins

  return resetToken;
};

userSchema.methods.createConfirmToken = function () {
  const confirmToken = crypto.randomBytes(18).toString('hex');

  this.accountConfirmToken = crypto
    .createHash('sha256')
    .update(confirmToken)
    .digest('hex');

  this.accountExpiresIn = Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days from this fn call

  return confirmToken;
};

const User = new mongoose.model('User', userSchema);

module.exports = User;
