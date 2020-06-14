const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, `A tour must have a name`],
      unique: true,
      trim: true,
      maxlength: [40, `A tour name must have less or equal 40 characters`],
      minlength: [10, `A tour name must have more or equal 10 character`],
      //validate: [validator.isAlpha, `Tour name must only contains character`],//not helpful, problem space (do not allow space)
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, `A tour must have a duration`],
    },
    maxGroupSize: {
      type: Number,
      required: [true, `A tour must have a GroupSize`],
    },
    difficulty: {
      type: String,
      required: [true, `A tour must have a difficulty`],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: `Difficulty is either easy, medium, or difficult`,
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, `Rating must be above 1.0`],
      max: [5, `Rating must be below 5.0`],
      set: (val) => Math.round(val * 10) / 10, // 4.66667, 46.6667, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, `A tour must have a price`],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current document on NEW document creation
          return val < this.price;
        },
        message: `Discount price should be below the Regular Price`,
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, `A tour must have a description`],
    },
    imageCover: {
      type: String,
      required: [true, `A tour must have a cover image`],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // does not show this field when select
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON: specified Geospatial data
      // Embed Onject, not tourSchema
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], // longitude 1st. latitude 2nd
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
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// virtual property cannot used in query because it not part of DB
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE: run befotr .save() and .create() command, not on insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// EMBEDING
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log(`Will save document`);
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE: allows us to run functions before or after a certain query is executed

// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v --passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  const difference = Date.now() - this.start;
  console.log(`Query took: ${difference} milliseconds`);
  //console.log(docs);
  next();
});

// AGGREGATION MIDDLEWARE: allows us to add hooks before or after an aggregation happens
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   //console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;

// virtual properties are fields we can define on our schema but that will not be persisted. So they will not be saved into the database in order to save us some space there.
