const express = require('express');
const router = express.Router();
const { buildQuery, getToggleState } = require('../util/helpers');
const { templates } = require('../emailTemplates/templates');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const validations = require('../middlewares/validations');
const { verifyApiKey } = require('../middlewares/auth');

const ApplicationModel = require('../models/applicationModel');
const LocationModel = require('../models/locationModel');
const CauseModel = require('../models/causeModel');
const EmailController = require('../controllers/emailController');
const formatLocation = require('../util/locationFormatter');

const routes = function () {
  router.get('/', async (req, res) => {
    const {
      query: {
        cause_id,
        email
      }
    } = req;

    const locations = await LocationModel.find({ cause_id });

    const preventAlreadyAppliedCheck = await getToggleState('prevent_already_applied_check');
    if (preventAlreadyAppliedCheck) return res.status(404).send({ message: 'No Application exists in the DB' });

    ApplicationModel
      .find({ cause_id, email })
      .then((docs) => {
        if (docs && docs.constructor === Array && docs.length === 0) {
          res.status(404).send({ message: 'No Application exists in the DB' });
        } else {
          const appliedLocations = new Set();
          for (let i = 0; i < docs.length; i++) {
            const { location_id: locationId } = docs[i];
            appliedLocations.add(locationId);
          }

          res.status(200).send({
            locations: Array.from(appliedLocations),
            applied_all: docs.length === locations.length
          });
        }
      })
      .catch((err) => {
        res.status(500).send({ message: 'Error finding application', err });
      });
  });

  router.get('/:id', (req, res) => {
    
  });

  router.post('/', validations.alreadyApplied, async (req, res) => {
    const {
      body: {
        cause_id,
        location_id,
        user
      },
    } = req;

    const cause = await CauseModel.findById({ _id: cause_id });
    const location = await LocationModel.findById({ _id: location_id });
    if (!cause) res.status(404).send('Cause not found!');
    if (!location) res.status(404).send('Location not found!');
    
    console.log('\n-------------------');
    console.log('cause_id:', cause_id);
    console.log('location_id:', location_id);
    console.log('user:', user);
    console.log('-------------------\n');

    const newApplication = new ApplicationModel({
      cause_id,
      location_id,
      first_name: user.first_name,
      last_name: user.last_name,
      ...user
    });

    newApplication.save(async (err, application) => {
      if (err) {
        console.log('err:', err);
        return res.status(500).send({ message: "Erorr Applying to Cause", err });
      } else {
        const emailInfo = {
          cause_id,
          first_name: user.first_name,
          last_name: user.last_name,
          location: formatLocation(location),
          position: cause.name,
          organization: cause.organization,
          contact_name: cause.contact.name,
          contact_email: cause.contact.email,
          contact_phone: cause.contact.phone,
          application_count: await ApplicationModel.count(),
          ...user,
        };
    
        console.log('emailInfo:', emailInfo);
    
        const emailRes = await EmailController.sendEmail('user-application', emailInfo);
        console.log('emailRes:', emailRes);
        return res.status(200).send(application);
      }
    });
  });

  router.delete('/:id', (req, res) => {
    
  });

  router.delete('/', verifyApiKey, (req, res) => {
    ApplicationModel.remove({}, (err, result) => {
      if (err) return res.status(200).send({ err });
      return res.status(200).send({ result });
    });
  });

  return router;
};

module.exports = routes;
