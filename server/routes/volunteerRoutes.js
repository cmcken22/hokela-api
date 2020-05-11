const express = require('express');
const router = express.Router();
const { buildQuery } = require('../util/helpers');
const { getUserInfo } = require('../middlewares/auth');

const VolunteerModel = require('../models/volunteerModel');
const VolunteerController = require('../controllers/volunteerController');

const routes = function () {
  router.get('/', (req, res) => {
    const query = buildQuery(req);

    VolunteerModel
      .find({ ...query })
      .then((doc) => {
        if (doc && doc.constructor === Array && doc.length === 0) {
          res.send({ message: 'No Volunteers exists in the DB' });
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
    const { body: { cause_id } } = req;
    console.log('\n==========');
    console.log('APPLY TO CAUSE:', cause_id);
    const createVolunteerReq = await VolunteerController.createVolunteer(cause_id, req.user);
    if (createVolunteerReq.status !== 200) {
      res.status(createVolunteerReq.status).send(createVolunteerReq.data.message);
      return;
    }
    const { data } = createVolunteerReq;
    res.status(createVolunteerReq.status).send(data);
  });

  router.patch('/:id', getUserInfo, async (req, res) => {
    const { params: { id } } = req;
    const { body: { cause_id, status } } = req;
    console.log('\n==========');
    console.log('UPDATE APPLICATION:', id, req.user);
    console.log('cause_id:', cause_id);
    console.log('status:', status);

    const updateVolunteerReq = await VolunteerController.updateVolunteer(id, req.body, req.user);
    if (updateVolunteerReq.status !== 200) {
      res.status(updateVolunteerReq.status).send(updateVolunteerReq.data.message);
      return;
    }
    const { data } = updateVolunteerReq;
    res.status(updateVolunteerReq.status).send(data);
  });

  router.delete('/:id', (req, res) => {
    // CauseModel
    //   .findByIdAndDelete(req.params.id, (err, cause) => {
    //     if (err) {
    //       res.status(500);
    //       res.send(err);
    //     } else if (cause === null) {
    //       res.status(500);
    //       res.send({ message: 'Caues id does not exist in mongo db' });
    //     } else {
    //       res.send({ message: 'Cause successfully deleted!', id: cause._id });
    //     }
    //   });
  });

  router.delete('/', (req, res) => {
    
  });

  return router;
};

module.exports = routes;
