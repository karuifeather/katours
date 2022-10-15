const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('Uncaught exception! Shutting down...');
  console.log(err.name, err.message);
  console.log(err);

  process.exit(1);
});

dotenv.config({ path: './config.env' });
// process.env.NODE_ENV = 'development';
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connection to the DB was successfully made!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is now listening on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('Promise rejection! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM!!! Shutting down...');
  server.close(() => {
    console.log('Processes terminated!!');
  });
});
