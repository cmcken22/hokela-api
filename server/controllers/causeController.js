const CauseModel = require('../models/causeModel');
const LocationModel = require('../models/locationModel');

const CauseController = {
  createCause: (data, user) => {
    return new Promise((resolve, reject) => {
      console.log('\n===============');
      console.log('DATA:', data);

      const newCause = new CauseModel({
        ...data,
        created_by: user,
        updated_by: user
      });
      newCause.save(async (err, cause) => {
        if (err) {
          console.log('err:', err);

          return resolve({
            status: 400,
            data: {
              message: err
            }
          });
        } else {
          console.log({ message: 'Cause successfully created!', id: cause._id });

          const { locations } = data;
          console.log('locations:', locations);
          for (let i = 0; i < locations.length; i++) {
            const location = locations[i];
            console.log('location:', location);
            const newLocation = new LocationModel({
              ...location,
              cause_id: newCause._id,
              created_by: user,
              updated_by: user
            });
            const result = await newLocation.save();
            console.log('result:', result);
          }

          return resolve({
            status: 200,
            data: cause
          })
        }
      });
    });
  },
  updateCause: (id, data, user) => {
    return new Promise((resolve, reject) => {
      CauseModel.findByIdAndUpdate(id,
        {
          ...data,
          updated_by: user,
          last_modified_date: Date.now()
        },
        (err, cause) => {
          if (err) {
            return resolve({
              status: 500,
              data: {
                message: err
              }
            });
          } else if (cause === null) {
            return resolve({
              status: 404,
              data: {
                message: 'Cause id does not exist in mongo db'
              }
            });
          } else {
            console.log('\nNEW CAUSE');
            console.log('cause._doc:', cause._doc);
            return resolve({
              status: 200,
              data: {
                ...cause._doc,
                ...data
              }
            });
          }
        });
    });
  },
}

module.exports = CauseController;