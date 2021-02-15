const Review = require('./../models/reviewModel');
const handle = require('../controllers/handlerFactory');

exports.setsTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getAllReviews = handle.getAll(Review);
exports.createReview = handle.createOne(Review);
exports.getReview = handle.getOne(Review);
exports.deleteReview = handle.deleteOne(Review);
exports.updateReview = handle.updateOne(Review);
