// Add dotenv support
require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const shopifyRouter = require('./routes/shopify');
const webhooksRouter = require('./routes/webhooks');

const app = express();

// Enhance error handling for JSON parsing
app.use(logger('dev'));
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf; // Save the raw buffer for HMAC check
  }
}));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next();
});
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for all routes
app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/shopify', shopifyRouter);
app.use('/webhooks', webhooksRouter);

module.exports = app;
