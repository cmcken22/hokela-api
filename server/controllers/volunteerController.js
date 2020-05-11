const VolunteerModel = require('../models/volunteerModel');

const VolunteerController = {
  createVolunteer: (id, user) => {
    return new Promise((resolve, reject) => {
      const newVolunteer = new VolunteerModel({
        cause_id: id,
        email: user.email,
        name: user.name,
        created_by: user,
        updated_by: user
      });
      newVolunteer.save((err, vounteer) => {
        if (err) {
          console.log('err:', err);
          return resolve({
            status: 400,
            data: {
              message: err
            }
          });
        } else {
          console.log({ message: 'Volunteer successfully created!', id: vounteer._id });
          return resolve({
            status: 200,
            data: vounteer
          })
        }
      });
    });
  },
  updateVolunteer: (id, data, user) => {
    return new Promise((resolve, reject) => {
      VolunteerModel.findByIdAndUpdate(id,
        {
          ...data,
          updated_by: user,
          last_modified_date: Date.now()
        },
        (err, volunteer) => {
          if (err) {
            return resolve({
              status: 500,
              data: {
                message: err
              }
            });
          } else if (volunteer === null) {
            return resolve({
              status: 404,
              data: {
                message: 'Volunteer id does not exist in mongo db'
              }
            });
          } else {
            return resolve({
              status: 200,
              data: {
                ...volunteer._doc,
                ...data
              }
            });
          }
        });
    });
  },
}

module.exports = VolunteerController;