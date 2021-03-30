const express = require('express');
const router = express.Router();
const { buildQuery } = require('../util/helpers');
const { getUserInfo } = require('../middlewares/auth');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const ApplicationModel = require('../models/applicationModel');
const CauseModel = require('../models/causeModel');
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

    const cause = await CauseModel.findById({ _id: cause_id });
    console.log('cause:', cause);
    if (!cause) res.send(404).send('Cause not found!');

    const { name, created_by } = cause;
    console.log('name:', name);

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
        const msg = {
          to: email, // Change to your recipient
          from: 'conner.mckenna@hokela.ca', // Change to your verified sender
          subject: 'Thank you!',
          text: 'TEST!!!',
          html: `<p>Thank you for applying to <strong>${name}</strong>!</p>`,
        }
        sgMail.send(msg).then(() => {
          console.log('EMAIL SENT1:', email);
        })
        .catch(err => {
          console.log('EMAIL ERR1:', email);
        })

        let users = ['conner.mckenna94@gmail.com', 'mathieu.mackay@hokela.ca'];
        if (created_by && created_by.email) {
          users.push(created_by.email)
        }

        for (let i = 0; i < users.length; i++) {
          const user = users[i];
          console.log('user:', user);
          console.log('sending follow up email to:', user);
          const msg1 = {
            to: user, // Change to your recipient
            from: 'conner.mckenna@hokela.ca', // Change to your verified sender
            subject: 'Hokela Info!',
            text: 'TEST!!!',
            html: `<p>User with email <strong>${email}</strong> has just applied to cause <strong>${name}</strong>!</p>`,
          }
          sgMail.send(msg1)
            .then(() => {
              console.log(`EMAIL SENT${i}:`, user);
            })
            .catch(err => {
              console.log(`EMAIL ERR${i}:`, user);
            })
        }

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
