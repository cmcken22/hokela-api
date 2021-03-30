const express = require('express');
const router = express.Router();
const { buildQuery } = require('../util/helpers');
const { getUserInfo } = require('../middlewares/auth');
const nodemailer = require('nodemailer');


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

    const { name } = cause;
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

        const transport = nodemailer.createTransport({
          host: "smtp.mailtrap.io",
          port: 2525,
          auth: {
            user: process.env.MAIL_TRAP_USER,
            pass: process.env.MAIL_TRAP_PASS
          }
        });
        
        const mailOptions = {
          from: email,
          to: 'conner.mckenna94@gmail.com',
          subject: 'Sending Email using Node.js',
          text: `${email} has applied to "${name}"!`
        };
        
        transport.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });

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
