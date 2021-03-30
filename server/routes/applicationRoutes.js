const express = require('express');
const router = express.Router();
const { buildQuery } = require('../util/helpers');
const { getUserInfo } = require('../middlewares/auth');

const ApplicationModel = require('../models/applicationModel');
// const VolunteerController = require('../controllers/volunteerController');

const routes = function () {
  router.get('/', getUserInfo, (req, res) => {
    // const query = buildQuery(req);

    const {
      query: { cause_id, location_id },
      user: { email },
    } = req;

    console.log('cause_id:', cause_id);
    console.log('location_id:', location_id);

    ApplicationModel
      .find({ cause_id, user_email: email })
      .then((doc) => {
        if (doc && doc.constructor === Array && doc.length === 0) {
          res.status(404).send({ message: 'No Application exists in the DB' });
        } else {
          res.status(200).send(doc);
        }
      })
      .catch((err) => {
        res.status(500).send({ message: 'Error finding application', err });
      });
  });

  router.get('/:id', (req, res) => {
    
  });

  router.post('/', getUserInfo, async (req, res) => {
    const {
      body: { cause_id, location_id },
      user: { email },
      user
    } = req;

    const newApplication = new ApplicationModel({
      cause_id,
      location_id,
      user_email: email,
      created_by: user
    });
    newApplication.save(async (err, application) => {
      if (err) {
        console.log('err:', err);
        return res.status(500).send({ message: "Erorr Applying to Cause", err });
      } else {
        console.log('\n=======================');
        console.log('location_id:', location_id);
        console.log('cause_id:', cause_id);
        console.log('email:', email);
        console.log('application:', application);

        return res.status(200).send(application);
      }
    });

  });

  router.patch('/:id', getUserInfo, async (req, res) => {
    
  });

  router.delete('/:id', (req, res) => {
    
  });

  router.delete('/', (req, res) => {
    
  });

  return router;
};

module.exports = routes;
