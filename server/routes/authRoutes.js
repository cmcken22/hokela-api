const express = require('express');
const router = express.Router();
const { getUserInfo } = require('../middlewares/auth');
const jwt = require('jsonwebtoken');

// const ApplicationModel = require('../models/applicationModel');
// const CauseModel = require('../models/causeModel');
// const VolunteerController = require('../controllers/volunteerController');

const routes = function () {
  router.get('/', (req, res) => {
    const { headers: { authorization } } = req;
    if (!authorization) return res.status(200).send(false);

    const [, accessToken] = authorization.split('Bearer ');
    if (!accessToken) return res.status(200).send(false);

    const decoded = jwt.decode(accessToken);
    const { hd } = decoded;
    if (hd === 'hokela.ca') return res.status(200).send(true);
    return res.status(200).send(false);
  });

  return router;
};

module.exports = routes;
