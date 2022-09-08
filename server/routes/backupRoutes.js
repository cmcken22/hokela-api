const express = require('express');
const router = express.Router();
const { verifyApiKey } = require('../middlewares/auth');
const path = require('path');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');
const mongoose = require('mongoose');
const ApplicationModel = require('../models/applicationModel');
const CauseModel = require('../models/causeModel');
const LocationModel = require('../models/locationModel');
const ToggleModel = require('../models/toggleModel');

const deleteFile = (fileName) => {
  fs.unlinkSync(fileName);
}

const pad = (num) => {
  if (num < 10) return `0${num}`;
  return num;
}
const getTodaysDate = () => {
  const date = new Date();
  return `${pad(date.getMonth() + 1)}_${pad(date.getDate())}_${date.getFullYear()}`;
}

const storage = new Storage({
  keyFilename: process.env.GCS_KEYFILE
});
const bucket = storage.bucket('hokela_db_dumps');

const uploadFile = (data, collectionName) => {
  return new Promise((resolve) => {
    const tempFilePath = path.resolve(__dirname, '../../backups');
    const tempFileName = `${tempFilePath}/${collectionName}.json`;
    const destFilePath = `/${getTodaysDate()}`;
    const destFileName = `${destFilePath}/${collectionName}.json`;

    fs.writeFile(tempFileName, JSON.stringify(data, undefined, 2), (err) => {
      if (!err) {
        bucket.upload(tempFileName, {
          destination: destFileName
        }).then(() => {
          console.log('FILE UPLOADED:', tempFileName);
          deleteFile(tempFileName);
          return resolve({ collectionName, status: true });
        }).catch((error) => {
          console.log('FILE UPLOAD FAILED1:', tempFileName);
          deleteFile(tempFileName);
          return resolve({ collectionName, status: error });
        });
      } else {
        console.log('FILE UPLOAD FAILED2:', tempFileName);
        deleteFile(tempFileName);
        return resolve({ collectionName, status: err });
      }
    });
  });
}

const restoreCollection = (title, model, date) => {
  return new Promise(async (resolve) => {
    await model.collection.drop();
      
    const test = await bucket.file(`${date}/${title}.json`).download({});
    const rawData = JSON.parse(test.toString());
    const { data } = rawData;

    for (let i = 0; i < data.length; i++) {
      const { _id, ...rest } = data[i];
      const exists = !!(await model.findById(_id));
      if (!exists) {
        const newObj = new model({
          _id: new mongoose.Types.ObjectId(_id),
          ...rest
        });
        newObj.save();
      }
    }
    return resolve({ collectionName: title, status: true });
  });
}

const entityMap = [
  {
    title: 'applications',
    model: ApplicationModel
  },
  {
    title: 'causes',
    model: CauseModel
  },
  {
    title: 'locations',
    model: LocationModel
  },
  {
    title: 'toggles',
    model: ToggleModel
  },
];

const routes = function () {
  router.post('/', verifyApiKey, async (req, res) => {    
    const promises = [];
    for (let i = 0; i < entityMap.length; i++) {
      const { title, model } = entityMap[i];
      const data = await model.find();
      if (!!data) {
        promises.push(uploadFile({ data }, title));
      }
    }

    Promise.all([...promises]).then((values) => {
      const failedBackups = values.filter(obj => obj.status !== true);
      if (failedBackups.length) {
        return res.status(500).send({
          err: 'Some backups have failed!',
          failedBackups
        });
      }
      return res.status(200).send('Succuess');
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send('ERR:', err);
    });
  });

  router.patch('/set', verifyApiKey, async (req, res) => {
    const { date } = req.body;
    const files = await bucket.getFiles({ prefix: `${date}/` });
    if (!files[0].length) {
      return res.status(400).send(`No back up found for: ${date}`);
    }

    const promises = [];
    for (let i = 0; i < entityMap.length; i++) {
      const { title, model } = entityMap[i];
      promises.push(restoreCollection(title, model, date));
    }

    Promise.all([...promises]).then((values) => {
      const failedRestorations = values.filter(obj => obj.status !== true);
      if (failedRestorations.length) {
        return res.status(500).send({
          err: 'Some restorations have failed!',
          failedRestorations
        });
      }
      return res.status(200).send('Succuess');
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).send('ERR:', err);
    });
  });

  return router;
};

module.exports = routes;
