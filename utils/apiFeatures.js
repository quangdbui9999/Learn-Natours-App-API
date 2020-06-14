class APIFeature {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1) a. Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1) b. Advanced Filtering
    // http://127.0.0.1:3000/api/v1/tours?difficulty=easy&duration[gte]=5&price[lt]=1500
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // console.log(JSON.parse(queryStr));
    // { difficulty: "easy", duration: {$gte: 5}}
    // { difficulty: 'easy', duration: { gte: '5' } }
    // gte, gt, lte, lt
    //let query = Tour.find(JSON.parse(queryStr));
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // 2. SORTING
    // http://127.0.0.1:3000/api/v1/tours?sort=-price,-ratingsAverage
    if (this.queryString.sort) {
      //console.log(this.queryString.sort);
      // sort('price ratingsAverage')
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
      //query = query.sort('-ratingsAverage');
    }
    return this;
  }

  limitFields() {
    // 3. Field limiting
    // http://127.0.0.1:3000/api/v1/tours?fields=name,duration,difficulty,price
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // 4. Pagination
    // http://127.0.0.1:3000/api/v1/tours?page=2&limit=10
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=2&limit=10 => 1-10, page 1, 11-20, page 2, 21-30 page 3
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeature;
