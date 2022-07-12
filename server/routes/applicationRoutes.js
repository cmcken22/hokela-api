const express = require('express');
const router = express.Router();
const { buildQuery } = require('../util/helpers');
const { templates } = require('../emailTemplates/templates');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const validations = require('../middlewares/validations');

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
    console.log('cause:', cause);
    console.log('location_id:', location_id);
    console.log('location:', location);
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
        // const { name, contact, organization } = cause;
        // const { first_name, email } = newApplication;

        const emailInfo = {
          cause_id,
          first_name: user.first_name,
          last_name: user.last_name,
          location: formatLocation(location),
          position: cause.name,
          organization: cause.organization,
          ...user,
        };

        console.log('emailInfo:', emailInfo);

        EmailController.sendEmail('user-application-results', emailInfo);

        // commented out for testing purposes
        // if (contact && contact.email) {
        //   const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        //   const valid = re.test(String(contact.email).toLowerCase());
        //   if (valid) {
        //     const followUpEmail = {
        //       to: contact.email,
        //       from: 'info@hokela.ca',
        //       subject: 'Hokela Info!',
        //       text: 'TEST!!!',
        //       html: templates.followUp({
        //         causeName: name,
        //         contactEmail: contact.email,
        //         organization,
        //         location: location.city.toLowerCase() === 'remote' ? `${location.city}` : `${location.city}, ${location.province}, ${location.country}`,
        //         ...user,
        //       })
        //     }
        //     sgMail.send(followUpEmail)
        //       .then(() => {
        //         console.log(`FOLLOW UP EMAIL SENT:`, contact.email);
        //       })
        //       .catch(err => {
        //         console.log(`FOLLOW UP EMAIL ERR:`, contact.email);
        //         console.log('err:', err);
        //       });
        //     } else {
        //       const err = `Invalid Email: ${contact.email}`;
        //       console.log(`FOLLOW UP EMAIL ERR:`, contact.email);
        //       console.log('err:', err);
        //   }
        // }
        // commented out for testing purposes

        // let users = ['conner.mckenna94@gmail.com', 'mathieu.mackay@hokela.ca'];
        // if (created_by && created_by.email) {
        //   users.push(created_by.email)
        // }

        // for (let i = 0; i < users.length; i++) {
        //   const user = users[i];
        //   console.log('user:', user);
        //   console.log('sending follow up email to:', user);
        //   const msg1 = {
        //     to: user, // Change to your recipient
        //     from: 'conner.mckenna@hokela.ca', // Change to your verified sender
        //     subject: 'Hokela Info!',
        //     text: 'TEST!!!',
        //     html: `<p>User with email <strong>${email}</strong> has just applied to cause <strong>${name}</strong>!</p>`,
        //   }
        //   sgMail.send(msg1)
        //     .then(() => {
        //       console.log(`EMAIL SENT${i}:`, user);
        //     })
        //     .catch(err => {
        //       console.log(`EMAIL ERR${i}:`, user);
        //     })
        // }

        return res.status(200).send(application);
      }
    });
  });

  router.delete('/:id', (req, res) => {
    
  });

  router.delete('/', (req, res) => {
    
  });

  return router;
};

module.exports = routes;
