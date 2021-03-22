const CauseModel = require('../models/causeModel');

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
      newCause.save((err, cause) => {
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