const express = require('express');
const router = express.Router();
const { validateAdmin } = require('../middlewares/auth');
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

const getFormattedTime = (date = new Date()) => {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  const strTime = hours + ':' + minutes + ampm;
  return strTime;
}

const getTodaysDateAndTime = () => {
  const date = new Date();
  return `${pad(date.getMonth() + 1)}_${pad(date.getDate())}_${date.getFullYear()}@${getFormattedTime()}`;
}

const storage = new Storage({
  keyFilename: process.env.GCS_KEYFILE
});
const bucket = storage.bucket('hokela_db_dumps');

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

const uploadFile = (data, collectionName, folderName) => {
  return new Promise((resolve) => {
    const tempFilePath = path.resolve(__dirname, '../../backups');
    const tempFileName = `${tempFilePath}/${collectionName}.json`;
    const destFileName = `/${folderName}/${collectionName}.json`;

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

const getBackups = () => {
  return new Promise(async (resolve) => {
    const [files] = await bucket.getFiles();
    const folderNames = files.map(file => file.name.split('/')[0]);
    const uniqueFolderNames = Array.from(new Set([...folderNames]));
    return resolve(uniqueFolderNames);
  });
}

const routes = function () {
  router.get('/', validateAdmin, async (req, res) => {
    try {
      const backups = await getBackups();
      return res.status(200).send({ data: backups });
    } catch (error) {
      return res.status(500).send(error);
    }
  });

  router.post('/', validateAdmin, async (req, res) => {
    try {
      const folderName = getTodaysDateAndTime();
      const promises = [];
      for (let i = 0; i < entityMap.length; i++) {
        const { title, model } = entityMap[i];
        const data = await model.find();
        if (!!data) {
          promises.push(uploadFile({ data }, title, folderName));
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
        return res.status(200).send({ data: folderName });
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).send(err);
      });
    } catch (error) {
      return res.status(500).send(error);
    }
  });

  router.patch('/:date', validateAdmin, async (req, res) => {
    try {
      const { date } = req.params;
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
        return res.status(500).send(err);
      });
    } catch (error) {
      return res.status(500).send(error);
    }
  });

  router.delete('/:date', validateAdmin, async (req, res) => {
    try {
      const MIN_BACKUPS_REQUIRED = 2;
      const { date } = req.params;
  
      const files = await bucket.getFiles({ prefix: `${date}/` });
      if (!files[0].length) {
        return res.status(400).send(`No back up found for: ${date}`);
      }
  
      const backups = await getBackups();
      if (!backups || backups.length <= MIN_BACKUPS_REQUIRED) {
        return res.status(500).send(`We don't have enough backups stored.. lets keep a few`);
      }
  
      bucket.deleteFiles({ prefix: `${date}/` }, (err) => {
        if (err) return res.status(500).send(`Err: ${err}`);
        return res.status(200).send(`Deleted backup for ${date}`);
      });
    } catch (error) {
      return res.status(500).send(error);
    }
  });

  return router;
};

module.exports = routes;
