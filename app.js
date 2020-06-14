const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// 1) GLOBAL MIDDLEWARE
// Set SECURITY HTTP HEADER
app.use(helmet());

// DEVELOPMENT LOGIN
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 100 requests from the same IP for 1 hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP! Please try again in 1 hour!',
});
app.use('/api', limiter); // limiter is middleware function

// BODY PARSER: reading data from body into rea.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// PREVENT PARAMETERS POLLUTION
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// SERVING STATIC FILE
app.use(express.static(`${__dirname}/public`)); // static file

// TEST MIDDLE WARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // convert it into a nice, readable string
  //console.log(req.headers);
  next();
});

// 3. ROUTE
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

// 4. START SERVER
module.exports = app;

/*
// put this code before listening with port
app.get('/', (req, res) => {
  res
    .status(200)
    .json({
      message: 'Client gui thong diep toi Server de chao Server!',
      app: 'Natours',
    });
});

app.post('/', (req, res) => {
  res.status(200).json({
    message: `You can POST to this endpoint.`,
    thongdiep: 'Du an lay kinh nghiem',
  });
});

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});*/

/* 

- express.json() is a middleware, middleware is a function that can modify the incoming request data and it stands between the middle of the request and the response, a step that the request goes through while it's being processed.
- req.body: body is the property that is gonna be available on the request
- req.params:  where all the parameters of all the variables that we define, these variables here in the URL are called parameters, and again, they are in req.params
- Param Middleware is middleware that only runs for certain parameters, when we have a certain parameter in our URL
- Static files is the files that are sitting in our file system that we currently cannot access using all routes.
*/
