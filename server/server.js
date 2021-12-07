const express = require('express');
const app = express(); // Instantiate the server.
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const config = require('../config.js');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT;
const { networkInterfaces } = require('os');

const mongoose = require('mongoose');
const USER = process.env.MONGODB_USER;
const PASSWORD = process.env.MONGODB_PASSWORD;
const URL = process.env.MONGODB_URL;
const DATABASE = process.env.MONGODB_DATABASE;

const routes = require('./routes/routes.js');
const locationRoutes = require('./routes/locationRoutes.js');
const volunteerRoutes = require('./routes/volunteerRoutes.js');
const applicationRoutes = require('./routes/applicationRoutes.js');
const authRoutes = require('./routes/authRoutes.js');

/* to avoid mongoose deprecation warnings */
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

app.get('/healthz', (req, res) => {
  console.log('/healthz');
  res.status(200).send({
    success: 'true',
    message: 'UP',
  });
});

/* For parsing cookies in the request headers. */
app.use(cookieParser());
app.use(cors());
// if (process.env.LOCAL) {
// }

/* For parsing the body of http(s) requests. */
app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ limit: '15mb', extended: true }));

/* This mounts the routes in routes.js to the '/' route. */
app.use('/cause-api/v1/causes', routes());
app.use('/cause-api/v1/locations', locationRoutes());
app.use('/cause-api/v1/volunteer', volunteerRoutes());
app.use('/cause-api/v1/apply', applicationRoutes());
app.use('/cause-api/v1/auth', authRoutes());

/* connect to database and listen to port only if the connection is succesful */
const options = {
  useNewUrlParser: true,
  reconnectTries: 5, // Never stop trying to reconnect
  reconnectInterval: 500, // Reconnect every 500ms
  poolSize: 5, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  dbName: DATABASE,
};

// app.listen(PORT, () => {
//   console.log(`Listening on port ${PORT}`);
// });

const logAddress = () => {
  const nets = networkInterfaces();
  const results = Object.create(null); // Or just '{}', an empty object
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }
  console.log('results:', results);
}

// mongoose.connect(`mongodb://localhost:27017/${DATABASE}`, options) // for local development
const uri = `mongodb+srv://${USER}:${PASSWORD}@${URL}?retryWrites=true&w=majority`;
// const uri = `mongodb+srv://admin:hokela27941713@cluster0.js2og.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
mongoose.connect(uri, options)
  .then(() => {
    console.log('Database connection successful');
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
      logAddress();
    });
  })
  .catch((err) => {
    console.error('Database connection error ' + err);
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
      logAddress();
    });
  });

module.exports = app;

