const CauseModel = require('../models/causeModel');
const locationModel = require('../models/locationModel');
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
        async (err, cause) => {
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

            const { locations } = data;
            console.log('\n---------------------');
            console.log('locations:', locations);

            const currentLocations = await LocationModel.find({ cause_id: cause._doc._id });
            console.log('currentLocations:', currentLocations);

            if (currentLocations && currentLocations.length) {
              for (let i = 0; i < currentLocations.length; i++) {
                const location = currentLocations[i];
                const { _id: locationId } = location;
                const currentLoc = locations && locations.find(loc => loc._id == locationId);
                if (!currentLoc) {
                  LocationModel.findByIdAndDelete(locationId, (err, result) => {
                    console.log('err:', err);
                  });
                }
              }
            }

            for (let i = 0; i < locations.length; i++) {
              const location = locations[i];
              const { _id: locationId } = location;
              console.log('location:', location);
              if (!locationId) {
                const newLocation = new LocationModel({
                  ...location,
                  cause_id: data._id,
                  created_by: user,
                  updated_by: user
                });
                console.log('newLocation:', newLocation);
                newLocation.save(async (err, loc) => {});
              } else {
                LocationModel.findByIdAndUpdate(locationId,
                  {
                    ...location,
                    updated_by: user,
                    last_modified_date: Date.now()
                  },
                  (err, loc) => {});
              }
            }

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