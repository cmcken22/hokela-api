const express = require('express');
const router = express.Router();
const { buildQuery } = require('../util/helpers');
const { getUserInfo } = require('../middlewares/auth');
const { networkInterfaces } = require('os');
const path = require('path');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');

const CauseModel = require('../models/causeModel');
const CauseController = require('../controllers/causeController');
const { hokelaCauses, allCauses } = require('../util/mockData');

const Multer = require('multer');
const MulterGoogleCloudStorage = require('@igorivaniuk/multer-google-storage');

// var uploadHandler = Multer({
//   storage: MulterGoogleCloudStorage.storageEngine()
// });

const uploadHandler = Multer({
  storage: MulterGoogleCloudStorage.storageEngine({
    limits: {
      fileSize: 15 * 1024 * 1024, // no larger than 15mb.
    },
    filename: function (req, file, cb) {
      console.log('--- GETTING FILE NAME ---');
      const { query: { org, type, name } } = req;
      console.log('org:', org);
      console.log('type:', type);
      console.log('name:', name);
      const filename = `companies/${org && org.toLowerCase()}/${type}/${name}`;
      console.log("Filename path - ", filename);
      cb(null, filename);
    },
  }),
  // fileFilter: function (req, file, cb) {
  //   console.log("Checking scopes for upload access.");
  //   if (true)
  //     cb(null, true);
  //   else
  //     cb(null, false);
  // }
});


const routes = function () {
  router.get('/test', (req, res) => {
    const fileName = req.query.fileName;
    console.log('fileName:', fileName);
    const filePath = fileName;

    // Check if file specified by the filePath exists 
    fs.exists(filePath, function (exists) {
      if (exists) {
        // Content-type is very interesting part that guarantee that
        // Web browser will handle response in an appropriate manner.
        res.writeHead(200, {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": "attachment; filename=" + fileName
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("ERROR File does not exist");
      }
    });
  });

  router.get('/test2', (req, res) => {
    console.log('\n---------------');
    const p = path.resolve('./');
    console.log('p:', p);
    fs.readdir(p, (err, files) => {
      const allFiles = [];
      files.forEach(file => {
        console.log(file);
        allFiles.push(file);
      });
      return res.status(200).send(allFiles);
    });
  });

  router.get('/', (req, res) => {
    const query = buildQuery(req);

    console.log('\n-----------');
    console.log('query:', query);
    console.log('-----------\n');

    // if (req.query.organization === 'Hokela Technologies') {
    //   return res.send(hokelaCauses);
    // }
    
    // return res.send(allCauses);

    CauseModel
      .find({ ...query })
      .sort({ 'created_date': 'desc' })
      .exec(function (err, docs) {
        console.log('docs:', docs);
        if (docs && docs.constructor === Array && docs.length === 0) {
          res.send({ message: 'No Causes exists in the DB' });
        } else {
          res.send(docs);
        }
        //do stuff with images
      });
      // .sort({ created_date: -1 })
      // .find({ organization: "Hokela Technologies" })
      // .then((doc) => {
      //   if (doc && doc.constructor === Array && doc.length === 0) {
      //     res.send({ message: 'No Causes exists in the DB' });
      //   } else {
      //     res.send(doc);
      //   }
      // })
      // .catch((err) => {
      //   res.send(err);
      // });
  });

  router.get('/images', async (req, res) => {
    const { query } = req;
    const { org } = query;

    const storage = new Storage({
      keyFilename: process.env.GCS_KEYFILE
    });

    const bucket = storage.bucket(process.env.GCS_BUCKET);
    const folder = `companies/${org && org.toLowerCase()}/images`;
    const [files] = await bucket.getFiles({ prefix: folder });

    const images = [];
    files.forEach(async (file) => {
      const { name } = file;
      const [, , , fileName] = name.split('/');
      if (!!fileName) {
        images.push(name);
      }
    });

    res.status(200).send(images);
  });

  router.get('/logos', async (req, res) => {
    const { query } = req;
    const { org } = query;

    const storage = new Storage({
      keyFilename: process.env.GCS_KEYFILE
    });

    const bucket = storage.bucket(process.env.GCS_BUCKET);
    const folder = `companies/${org && org.toLowerCase()}/logos`;
    const [files] = await bucket.getFiles({ prefix: folder });

    const images = [];
    files.forEach(async (file) => {
      const { name } = file;
      const [, , , fileName] = name.split('/');
      if (!!fileName) {
        images.push(name);
      }
    });

    res.status(200).send(images);
  });

  router.get('/info', async (req, res) => {
    const { query: { field } } = req;
    const fieldSet = new Set();

    CauseModel
      .find()
      .select(field)
      .then((docs) => {
        for (let i = 0; i < docs.length; i++) {
          const doc = docs[i];
          const { [field]: temp } = doc;
          fieldSet.add(temp);
        }
        return res.status(200).send(Array.from(fieldSet));
      })
      .catch((err) => {
        return res.status(500).send(err);
      });
  });

  router.post('/upload-image', uploadHandler.any(), async (req, res) => {

    console.log('--- UPLOADING FILE ---');
    const { query: { org, type, name } } = req;
    console.log('org:', org);
    console.log('type:', type);
    console.log('name:', name);

    const storage = new Storage({
      keyFilename: process.env.GCS_KEYFILE
    });

    const filename = `companies/${org && org.toLowerCase()}/${type}/${name}`;
    console.log('UPLOADING FILE:', filename);
    console.log('BUCKET:', process.env.GCS_BUCKET);
    console.log('GCS_KEYFILE:', process.env.GCS_KEYFILE);

    await storage.bucket(process.env.GCS_BUCKET).file(filename).makePublic();

    return res.status(200).send(filename);
  });

  router.get('/:id', (req, res) => {
    
  });

  router.post('/', getUserInfo, async (req, res) => {
    const createCauesReq = await CauseController.createCause(req.body, req.user);
    if (createCauesReq.status !== 200) {
      res.status(createCauesReq.status).send(createCauesReq.data.message);
      return;
    }
    const { data } = createCauesReq;
    res.status(createCauesReq.status).send(data);
  });

  router.patch('/:id', getUserInfo, async (req, res) => {
    console.log('req.user', req.user);
    const { params: { id } } = req;
    const updateCaueReq = await CauseController.updateCause(id, req.body, req.user);
    if (updateCaueReq.status !== 200) {
      res.status(updateCaueReq.status).send(updateCaueReq.data.message);
      return;
    }
    const { data } = updateCaueReq;
    res.status(updateCaueReq.status).send(data);
  });

  router.delete('/:id', (req, res) => {
    CauseModel
      .findByIdAndDelete(req.params.id, (err, cause) => {
        if (err) {
          res.status(500);
          res.send(err);
        } else if (cause === null) {
          res.status(500);
          res.send({ message: 'Caues id does not exist in mongo db' });
        } else {
          res.send({ message: 'Cause successfully deleted!', id: cause._id });
        }
      });
  });

  router.delete('/', (req, res) => {
    
  });

  return router;
};

module.exports = routes;
