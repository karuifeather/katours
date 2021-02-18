const multer = require('multer');
const sharp = require('sharp');

const Tour = require('./../models/tourModel');
const catchAsyncErrors = require('./../utils/catchAsync');
const handle = require('./handlerFactory');
const AppError = require('../utils/appError');

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

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsyncErrors(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1. Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 45 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2. Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (image, i) => {
      const imageName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpg`;

      await sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${imageName}`);

      req.body.images.push(imageName);
    })
  );

  next();
});

exports.getAllTours = handle.getAll(Tour);
exports.getTour = handle.getOne(Tour, { path: 'reviews' });
exports.updateTour = handle.updateOne(Tour);
exports.createTour = handle.createOne(Tour);
exports.deleteTour = handle.deleteOne(Tour);

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
  //limit=5&sort=-ratingsAverage,price
};

exports.getTourStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$difficulty',
        // _id: '$ratingsAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
    {
      $sort: { avgPrice: 1 }, // 1 for ascending
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: stats,
    },
  });
});

exports.getMonthyPlan = catchAsyncErrors(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTours: -1 }, // -1 for descending
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: plan,
    },
  });
});

exports.getToursWithin = catchAsyncErrors(async (req, res, next) => {
  const { distance, unit, latlng } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsyncErrors(async (req, res, next) => {
  const { unit, latlng } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      // when using geoNearkeep in your head that
      // it needs to be always the first
      // in the pipeline
      $geoNear: {
        // if there are more indices with 2dsphere, then you gotta
        // define the key property: see docs
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'howFar',
        distanceMultiplier: multiplier,
      },
      $project: {
        howFar: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
