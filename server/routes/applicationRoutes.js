const express = require('express');
const router = express.Router();
const { buildQuery } = require('../util/helpers');
const { getUserInfo } = require('../middlewares/auth');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const ApplicationModel = require('../models/applicationModel');
const LocationModel = require('../models/locationModel');
const CauseModel = require('../models/causeModel');
// const VolunteerController = require('../controllers/volunteerController');

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

  router.post('/', async (req, res) => {
    const {
      body: {
        cause_id,
        location_id,
        user
      },
    } = req;

    const cause = await CauseModel.findById({ _id: cause_id });
    if (!cause) res.status(404).send('Cause not found!');

    console.log('\n-------------------');
    console.log('cause_id:', cause_id);
    console.log('location_id:', location_id);
    console.log('user:', user);
    console.log('-------------------\n');

    const newApplication = new ApplicationModel({
      cause_id,
      location_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
    });

    newApplication.save(async (err, application) => {
      if (err) {
        console.log('err:', err);
        return res.status(500).send({ message: "Erorr Applying to Cause", err });
      } else {
        const { name, contact } = cause;
        const { first_name, email } = newApplication;

        const thankYouMsg = {
          to: email,
          from: 'conner.mckenna@hokela.ca',
          subject: 'Thank you!',
          text: 'TEST!!!',
          html: `
            <div style="width:100%">
              <p>
                Hi ${first_name},
              </p>
              <p>
                Thank you for applying to <strong>${name}</strong>!
              </p>
              <br></br>
              <img
                src="https://storage.googleapis.com/hokela-bucket/companies/hokela%20technologies/logos/hokela_icon.png"
                style="height:60px;width:60px"
              ></img>
              <br></br>
              <p>
                For any questions please contact <strong>mathieu.mackay@hokela.ca</strong>
              </p>
            </div>
          `,
        }

        sgMail.send(thankYouMsg).then(() => {
          console.log('THANK YOU EMAIL SENT:', email);
        })
        .catch(err => {
          console.log('THANK YOU EMAIL ERR:', email);
          console.log('err:', err);
        });

        if (contact && contact.email) {
          const followUpEmail = {
            to: contact.email,
            from: 'conner.mckenna@hokela.ca',
            subject: 'Hokela Info!',
            text: 'TEST!!!',
            html: `
              <p>
                User with email <strong>${email}</strong> has just applied to cause <strong>${name}</strong>!
                <br></br>
                Cause Owner: <strong>${contact.email}</strong>
              </p>
            `,
          }
          sgMail.send(followUpEmail)
            .then(() => {
              console.log(`FOLLOW UP EMAIL SENT:`, contact.email);
            })
            .catch(err => {
              console.log(`FOLLOW UP EMAIL ERR:`, contact.email);
              console.log('err:', err);
            });
        }

    //     // let users = ['conner.mckenna94@gmail.com', 'mathieu.mackay@hokela.ca'];
    //     // if (created_by && created_by.email) {
    //     //   users.push(created_by.email)
    //     // }

    //     // for (let i = 0; i < users.length; i++) {
    //     //   const user = users[i];
    //     //   console.log('user:', user);
    //     //   console.log('sending follow up email to:', user);
    //     //   const msg1 = {
    //     //     to: user, // Change to your recipient
    //     //     from: 'conner.mckenna@hokela.ca', // Change to your verified sender
    //     //     subject: 'Hokela Info!',
    //     //     text: 'TEST!!!',
    //     //     html: `<p>User with email <strong>${email}</strong> has just applied to cause <strong>${name}</strong>!</p>`,
    //     //   }
    //     //   sgMail.send(msg1)
    //     //     .then(() => {
    //     //       console.log(`EMAIL SENT${i}:`, user);
    //     //     })
    //     //     .catch(err => {
    //     //       console.log(`EMAIL ERR${i}:`, user);
    //     //     })
    //     // }

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
