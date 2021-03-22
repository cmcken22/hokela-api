const express = require('express');
const app = express(); // Instantiate the server.
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('../config.js');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const PORT = process.env.PORT;

const mongoose = require('mongoose');
const USER = process.env.MONGODB_USER;
const PASSWORD = process.env.MONGODB_PASSWORD;
const URL = process.env.MONGODB_URL;
const DATABASE = process.env.MONGODB_DATABASE;

const routes = require('./routes/routes.js');
const volunteerRoutes = require('./routes/volunteerRoutes.js');

/* to avoid mongoose deprecation warnings */
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

app.get('/healthz', (req, res) => {
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
app.use('/cause-api/v1/volunteer', volunteerRoutes());

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

// mongoose.connect(`mongodb://${USER}:${PASSWORD}@${URL}`, options)
const uri = `mongodb+srv://${USER}:${PASSWORD}@${URL}?retryWrites=true&w=majority`;
console.log('uri:', uri);
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connect(uri, options)
  .then(() => {
    console.log('Database connection successful');
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error ' + err);
    // app.listen(PORT, () => {
    //   console.log(`Listening on port ${PORT}`);
    // });
  });

module.exports = app;

