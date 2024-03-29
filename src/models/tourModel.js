const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less than or equal to 40 characters',
      ],
      minlength: [
        10,
        'A tour name must have more than or equal to 10 characters',
      ],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          "Difficulty can only be either 'easy', 'medium' or 'difficult'",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to curent doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be less than the given price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
      select: false,
    },
    startLocation: {
      // GeoJson format to describe geo-spatial data
      // in order to differentiate this special object from
      // mongoDB schema options
      // we'll need type and coordinates properties defined
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      // in GeoJson longitudes first, then latitudes
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array //for embedding
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// tourSchema.index({price: 1})
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({
  startLocation: '2dsphere',
});

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Document save middlewares runs before .save() and .create() but not before .insertMany()
// Runs right before saving into db
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  // this points to document object
  next();
});

// // Additional steps for embedding documents after creating a list of ids in schema
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.gudies = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function(next) {
//   true;
//   next();
// })

// // Post middleware functions run after the document is saved
// // thus have access to the doc saved
// tourSchema.post('save', function(doc, next) {
//   true;
// })

// Query middlewares
tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre('find', function (next) {
  // in query middlewares
  // this points to the query
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -slug',
  });
  next();
});

// // Runs after the query is executed
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(docs);
//   console.log(`Query took ${Date.now() - this.start} ms.`);
//   next();
// });

// Aggregation middlewares
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   // this points to aggregate object
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
