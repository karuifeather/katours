module.exports = class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryCopy = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'fields', 'limit'];
    excludedFields.forEach((el) => delete queryCopy[el]);

    /**
     * We gonna convert this {difficulty: 'easy', duration: {gte: '5'}}
     * To this {difficulty: 'easy', duration: {'$gte': '5'}}
     */
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this; // the entire object
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      // sort('price ratingsAverage')
    } else {
      this.query = this.query.sort('-createdAt');
      // - for descending
    }

    return this; // the entire object
  }

  projectFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
      // - excludes __v
    }

    return this; // the entire object
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limitAmt = this.queryString.limit * 1 || 100;
    const skipAmt = (page - 1) * limitAmt;
    this.query = this.query.skip(skipAmt).limit(limitAmt);

    return this; // the entire object
  }
};
