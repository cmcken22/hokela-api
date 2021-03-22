const express = require('express');
const router = express.Router();
const { buildQuery } = require('../util/helpers');
const { getUserInfo } = require('../middlewares/auth');

const CauseModel = require('../models/causeModel');
const CauseController = require('../controllers/causeController');
const { hokelaCauses, allCauses } = require('../util/mockData');

const routes = function () {
  router.get('/', (req, res) => {
    const query = buildQuery(req);

    console.log('\n-----------');
    console.log('query:', query);
    console.log('-----------\n');

    // if (req.query.organization === 'Hokela Technologies') {
    //   return res.send(hokelaCauses);
    // }
    
    // return res.send(allCauses);

    CauseModel
      .find({ ...query })
      // .find({ organization: "Hokela Technologies" })
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

  router.post('/', getUserInfo, async (req, res) => {
    const createCauesReq = await CauseController.createCause(req.body, req.user);
    if (createCauesReq.status !== 200) {
      res.status(createCauesReq.status).send(createCauesReq.data.message);
      return;
    }
    const { data } = createCauesReq;
    res.status(createCauesReq.status).send(data);
  });

  router.patch('/:id', getUserInfo, async (req, res) => {
    console.log('req.user', req.user);
    const { params: { id } } = req;
    const updateCaueReq = await CauseController.updateCause(id, req.body, req.user);
    if (updateCaueReq.status !== 200) {
      res.status(updateCaueReq.status).send(updateCaueReq.data.message);
      return;
    }
    const { data } = updateCaueReq;
    res.status(updateCaueReq.status).send(data);
  });

  router.delete('/:id', (req, res) => {
    CauseModel
      .findByIdAndDelete(req.params.id, (err, cause) => {
        if (err) {
          res.status(500);
          res.send(err);
        } else if (cause === null) {
          res.status(500);
          res.send({ message: 'Caues id does not exist in mongo db' });
        } else {
          res.send({ message: 'Cause successfully deleted!', id: cause._id });
        }
      });
  });

  router.delete('/', (req, res) => {
    
  });

  return router;
};

module.exports = routes;
