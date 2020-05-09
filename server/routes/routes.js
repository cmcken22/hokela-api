const express = require('express');
const router = express.Router();
const { buildQuery, buildUserInfo } = require('../util/helpers');
const { getUserInfo } = require('../middlewares/auth');

const CauseModel = require('../models/causeModel');
const CauseController = require('../controllers/causeController');

const routes = function () {
  router.get('/', (req, res) => {
    const query = buildQuery(req);

    CauseModel
      .find({ ...query })
      .then((doc) => {
        if (doc && doc.constructor === Array && doc.length === 0) {
          res.send({ message: 'No Causes exists in the DB' });
        } else {
          res.send(doc);
        }
      })
      .catch((err) => {
        res.send(err);
      });
  });

  router.get('/:id', (req, res) => {
    
  });

  router.put('/:id', async (req, res) => {
    
  });

  router.delete('/:id', (req, res) => {
    
  });

  router.delete('/', (req, res) => {
    
  });

  return router;
};

module.exports = routes;
