import path from 'path';
import crypto from 'crypto';

import express from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';

import { AppError } from './utils/appError';
import { globalErrorHandler } from './controllers/errorController';
import { webhookCheckout } from './controllers/bookingController';
import { router as tourRouter } from './routes/tourRoutes';
import { router as userRouter } from './routes/userRoutes';
import { router as reviewRouter } from './routes/reviewRoutes';
import { router as viewRouter } from './routes/viewRoutes';
import { router as bookingRouter } from './routes/bookingRoutes';

const app = express();

app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/**********************************
 * GLOBAL MIDDLEWARES
 * ********************************/
// Implement cors for simple requests
app.use(cors());

// Implement cors for complex requests for OPTION req in preflight phase
app.options('*', cors());

// Serving static files
app.use(express.static(path.join(__dirname, '../public')));

// Sets Security HTTP headers
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('hex');
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'block-all-mixed-content': [],
        'font-src': ["'self'", 'https:', 'data:'],
        'img-src': ["'self'", 'data:'],
        'frame-ancestors': ["'self'"],
        'object-src': ["'none'"],
        'frame-src': ['js.stripe.com'],
        'script-src': [
          "'self'",
          'api.mapbox.com',
          'js.stripe.com',
          (req, res) => `'nonce-${res.locals.cspNonce}'`,
        ],
        'connect-src': ["'self'", 'api.mapbox.com', 'events.mapbox.com'],
        'worker-src': ['blob:'],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

// Development logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limits requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in an hour!',
});
app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevents parameter pollution
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

app.use(compression());

// Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Cant't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export { app };
