const express = require('express');
const { verifyApiKey } = require('../middlewares/auth');
const router = express.Router();

const ToggleModel = require('../models/toggleModel');

const routes = function () {
  router.get('/', async (req, res) => {

    let query = {};
    let searchByName = false;

    if (req.query && !!req.query.name) {
      searchByName = true;
      query = {
        ...query,
        name: req.query.name
      };
    }

    ToggleModel
      .find({ ...query })
      .then((docs) => {
        if (docs && docs.constructor === Array && docs.length === 0) {
          res.status(404).send({ message: 'No Toggle(s) found' });
        } else {
          // TODO: send most recent
          return res.status(200).send(searchByName ? docs[0] : docs);
        }
      })
      .catch((err) => {
        res.status(500).send({ message: 'Error finding application', err });
      });
  });

  router.post('/', verifyApiKey, async (req, res) => {
    const { name, state } = req.body;

    const newToggle = new ToggleModel({
      name,
      state
    });
    
    newToggle.save(async (err, toggle) => {
      if (err) {
        console.log('err:', err);
        return res.status(500).send({ message: "Erorr creating toggle", err });
      } else {    
        return res.status(200).send(toggle);
      }
    });
  });

  router.patch('/:id', verifyApiKey, async (req, res) => {
    const { params: { id } } = req;
    const { body: { name, state } } = req;

    if (!!name) {
      return res.status(500).send({ err: `Cannot edit name!` });
    }

    let query = {};
    if (!!state) {
      if (state !== "FeatureOn" && state !== "FeatureOff") {
        return res.status(500).send({ err: `Illegal state type (${state}).` });
      }
      query = {
        ...query,
        state
      };
    }

    ToggleModel.findByIdAndUpdate(id, { ...query },
      async (err, toggle) => {
        if (err) {
          return res.status(500).send({ message: err });
        } else if (toggle === null) {
          return res.status(404).send({ message: 'Toggle id does not exist in mongo db' });
        } else {
          const newToggle = await ToggleModel.findById(id);
          return res.status(200).send(newToggle);
        }
      });
  });

  router.delete('/:id', verifyApiKey, (req, res) => {
    const { params: { id } } = req;
    ToggleModel.remove({ _id: id }, (err, result) => {
      if (err) return res.status(200).send({ err });
      return res.status(200).send({ result });
    });
  });

  return router;
};

module.exports = routes;
