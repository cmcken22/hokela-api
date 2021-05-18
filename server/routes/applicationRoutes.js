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
      first_name: user.first_name,
      last_name: user.last_name,
      ...user
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
          subject: 'Thanks for your Application!',
          text: 'TEST!!!',
          html: `
          <div style="width: 100%; background: rgb(248, 248, 248); padding: 20px 0px;">
            <div style="width: 80%; margin: 0 auto; padding-top: 60px; background: white; padding: 40px 30px">
              <div style="height: 75px; width: 100%; margin-bottom: 60px;">
                <div style=" height: 100%; margin: 0 auto; background-image: url('https://storage.googleapis.com/hokela-bucket/companies/hokela%20technologies/logos/hokela_logo_original.png'); background-size: contain; background-position: center; background-repeat: no-repeat;">
                </div>
              </div>
              <h1 style="font-family: open sans,Arial,sans-serif; color: #ff6161; text-align: center;">
                Thank you for your application!
              </h1>
          
              <br></br>
          
              <p style="font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 16px;">
                Hi ${first_name},
              </p>
              <p style="font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 16px;">
                Thank you for your interest and desire to volunteer! We will review your application and a representative will
                contact you shortly regarding the next steps.
              </p>
              <p style="font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 16px;">
                In the meantime, feel free to browse our other available positions!
              </p>
              <p style="font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 16px;">
                And as always, if you have any questions or would like to get in touch with us, you may contact us at
                <a href="mailto:info@hokela.ca"
                  style="color: #15c; font-family: helvetica,sans-serif; font-size: 16px; font-weight: 700; text-decoration: none;">info@hokela.ca</a>.
              </p>
          
              <br></br>
          
              <div style="display: inline-flex; align-items: center; width: 100%;">
          
                <div
                  style="height: 39px; width: 185px; background: #ff6161; margin: auto; border-radius: 100px; display: inline-flex; margin-bottom: 20px;">
                  <a href="https://test-hokela.herokuapp.com/causes"
                    style="color: #ffffff; font-family: tahoma,sans-serif; font-size: 16px; text-align: center; margin: 0 auto; text-decoration: none; padding-top: 7px;">
                    Find more causes
                  </a>
                </div>
              </div>
          
              <br></br>
          
              <p style="text-align: center; font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 12px;">
                Please do not reply to this email.
              </p>
              <p style="text-align: center; font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 12px;">
                If you have any questions, you may contact us at <a href="mailto:info@hokela.ca"
                  style="color: #15c; font-size: 12px; font-weight: 700; text-decoration: none;">info@hokela.ca</a>.
              </p>
              <p style="text-align: center; font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 12px;">
                To view our Terms of Use, click <a href="https://test-hokela.herokuapp.com/terms"
                  style="color: #109fff; font-size: 12px; font-weight: 400;">here</a>.
              </p>
              <p style="text-align: center; font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 12px;">
                Toronto, Ontario, Canada
              </p>
          
              <br></br>
          
              <p style="text-align: center; font-family: tahoma,sans-serif; color: #2f2e2c; font-size: 12px;">
                <a href="https://test-hokela.herokuapp.com" style="color: #2f2e2c; text-decoration: none;">
                  Go to Hokela
                </a>
              </p>
            </div>
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
          const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          const valid = re.test(String(contact.email).toLowerCase());
          if (valid) {
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
            } else {
              const err = `Invalid Email: ${contact.email}`;
              console.log(`FOLLOW UP EMAIL ERR:`, contact.email);
              console.log('err:', err);
          }
        }

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
