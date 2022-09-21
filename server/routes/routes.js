const express = require("express");
const router = express.Router();
const { getUserInfo, validateAdmin } = require("../middlewares/auth");
const { networkInterfaces } = require("os");
const path = require("path");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");
const Base64 = require("js-base64").Base64;
const axios = require("axios");

const mongoose = require("mongoose");
const CauseModel = require("../models/causeModel");
const LocationModel = require("../models/locationModel");
const CauseController = require("../controllers/causeController");
const { hokelaCauses, allCauses } = require("../util/mockData");

const { aggregateCausesWithLocations } = require("../util/helpers");

const Multer = require("multer");
const MulterGoogleCloudStorage = require("@igorivaniuk/multer-google-storage");

// var uploadHandler = Multer({
//   storage: MulterGoogleCloudStorage.storageEngine()
// });

const uploadHandler = Multer({
  storage: MulterGoogleCloudStorage.storageEngine({
    limits: {
      fileSize: 15 * 1024 * 1024, // no larger than 15mb.
    },
    filename: function(req, file, cb) {
      console.log("--- GETTING FILE NAME ---");
      const {
        query: { org, type, name },
      } = req;
      console.log("org:", org);
      console.log("type:", type);
      console.log("name:", name);
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

const routes = function() {
  router.get("/", async (req, res) => {
    const { page_token: pageToken, page_size: pageSize, status } = req.query;

    console.log("GET CAUSES:", status);

    const allData = await aggregateCausesWithLocations(req.query);

    if (allData && allData.docs && allData.docs.length) {
      const decodedPageToken =
        pageToken !== undefined ? JSON.parse(Base64.decode(pageToken)) : null;
      const { docs, metaData } = allData;
      const totalCount = metaData[0].total;

      let nextPageToken = null;
      let nextMetaData = null;

      if (!!pageSize) {
        // if there is no pageToken then we must be on page 0
        if (pageSize && !decodedPageToken) {
          nextPageToken = {
            page_size: pageSize,
            page_offset: 1,
            total: totalCount,
          };
          nextMetaData = {
            page: 1,
            count: docs.length,
            total: totalCount,
            size: JSON.parse(pageSize),
          };
        }
        // otherwise, increment the page_offset
        else if (pageSize && !!decodedPageToken) {
          nextPageToken = {
            page_size: decodedPageToken.page_size,
            page_offset: decodedPageToken.page_offset + 1,
            total: totalCount,
          };
          nextMetaData = {
            page: nextPageToken.page_offset,
            count: docs.length,
            total: totalCount,
            size: JSON.parse(pageSize),
          };
        }
        // lastly, we are all out of documents, clear the next page token
        if (!!nextPageToken) {
          const { page_size, page_offset } = nextPageToken;
          nextMetaData = {
            page: page_offset,
            count: docs.length,
            total: totalCount,
            size: JSON.parse(pageSize),
          };
          if (page_size * page_offset >= totalCount) {
            nextPageToken = null;
          }
        }
      }

      return res.send({
        data: {
          docs: docs,
          next_page_token: !!nextPageToken
            ? Base64.encode(JSON.stringify(nextPageToken))
            : null,
          meta_data: { ...nextMetaData },
        },
      });
    }

    return res.status(200).send({
      data: {
        docs: [],
      },
    });
  });

  router.get("/find-page/:id", async (req, res) => {
    const {
      params: { id },
      query,
    } = req;

    const serializeQuery = function(obj) {
      var str = [];
      for (var p in obj)
        if (obj.hasOwnProperty(p)) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
      return str.join("&");
    };

    const queryString = serializeQuery(query);
    let URL = `${process.env.API_URL}/cause-api/v1/causes`;
    if (queryString) URL = `${URL}?${queryString}`;

    const getPages = async (URL, nextPageToken, pages) => {
      const result = await axios.get(
        !!nextPageToken ? `${URL}&page_token=${nextPageToken}` : URL
      );
      if (result.status === 200 && result.data) {
        const {
          data: { data },
        } = result;
        const { docs, next_page_token } = data;
        pages.push(data);
        if (docs && docs.length) {
          const currentCause = docs.find((cause) => cause._id === id);
          if (currentCause) {
            return pages;
          } else if (next_page_token) {
            return getPages(URL, next_page_token, pages);
          }
        }
      }
      return pages;
    };
    const pages = await getPages(URL, null, []);
    console.log("pages:", pages);

    return res.status(200).send({ data: { pages } });
  });

  router.get("/images", async (req, res) => {
    const { query } = req;
    const { org } = query;

    const storage = new Storage({
      keyFilename: process.env.GCS_KEYFILE,
    });

    const bucket = storage.bucket(process.env.GCS_BUCKET);
    const folder = `companies/${org && org.toLowerCase()}/images`;
    const [files] = await bucket.getFiles({ prefix: folder });

    const images = [];
    files.forEach(async (file) => {
      const { name } = file;
      const [, , , fileName] = name.split("/");
      if (!!fileName) {
        images.push(name);
      }
    });

    res.status(200).send(images);
  });

  router.get("/logos", async (req, res) => {
    const { query } = req;
    const { org } = query;

    const storage = new Storage({
      keyFilename: process.env.GCS_KEYFILE,
    });

    const bucket = storage.bucket(process.env.GCS_BUCKET);
    const folder = `companies/${org && org.toLowerCase()}/logos`;
    const [files] = await bucket.getFiles({ prefix: folder });

    const images = [];
    files.forEach(async (file) => {
      const { name } = file;
      const [, , , fileName] = name.split("/");
      if (!!fileName) {
        images.push(name);
      }
    });

    res.status(200).send(images);
  });

  router.get("/contact", async (req, res) => {
    const { query } = req;

    CauseModel.find({ ...query })
      .sort({ created_date: "desc" })
      .exec(async (err, docs) => {
        if (err) {
          res.status(500).send(err);
        }
        if (!docs || !docs.length) {
          res.status(404).send([]);
        }
        let result = [];
        for (let i = 0; i < docs.length; i++) {
          const doc = docs[i];
          const { contact } = doc;
          result.push(contact);
        }
        res.status(200).send(result);
      });
  });

  router.get("/info", async (req, res) => {
    const {
      query: { field },
    } = req;
    const fieldSet = new Set();

    if (field === "locations") {
      const citySet = new Set();
      const provinceSet = new Set();
      const countrySet = new Set();
      const addressSet = new Set();

      LocationModel.find()
        .then((docs) => {
          for (let i = 0; i < docs.length; i++) {
            const doc = docs[i];
            const { city, province, country } = doc;
            if (!!city) citySet.add(city);
            if (!!province) provinceSet.add(province);
            if (!!country) countrySet.add(country);
            if (!!city) {
              const string = `${city}${province ? `, ${province}` : ""}`;
              addressSet.add(string);
            }
          }
          return res.status(200).send({
            cities: Array.from(citySet),
            provinces: Array.from(provinceSet),
            countries: Array.from(countrySet),
            locations: Array.from(addressSet),
          });
        })
        .catch((err) => {
          return res.status(500).send(err);
        });
    } else {
      CauseModel.find()
        .select(field)
        .then((docs) => {
          for (let i = 0; i < docs.length; i++) {
            const doc = docs[i];
            const { [field]: temp } = doc;
            if (!!temp) {
              fieldSet.add(temp);
            }
          }
          return res.status(200).send(Array.from(fieldSet));
        })
        .catch((err) => {
          return res.status(500).send(err);
        });
    }
  });

  router.get("/type-ahead-options", async (req, res) => {
    const citySet = new Set();
    const provinceSet = new Set();
    const countrySet = new Set();
    const addressSet = new Set();
    const organizationSet = new Set();
    const areaSet = new Set();
    const otherSkillsSet = new Set();

    const locations = await LocationModel.find();
    if (locations && locations.length) {
      for (let i = 0; i < locations.length; i++) {
        const doc = locations[i];
        const { city, province, country } = doc;
        if (!!city) citySet.add(city);
        if (!!province) provinceSet.add(province);
        if (!!country) countrySet.add(country);
        if (!!city) {
          const string = `${city}${province ? `, ${province}` : ""}`;
          addressSet.add(string);
        }
      }
    }

    const causes = await CauseModel.find();
    if (causes && causes.length) {
      for (let i = 0; i < causes.length; i++) {
        const doc = causes[i];
        const { organization, area, other_skills } = doc;
        if (!!organization) organizationSet.add(organization);
        // if (!!area) areaSet.add(area);
        if (!!other_skills) {
          for (let i = 0; i < other_skills.length; i++) {
            const otherSkill = other_skills[i];
            otherSkillsSet.add(otherSkill);
          }
        }
      }
    }

    return res.status(200).send({
      cities: Array.from(citySet),
      provinces: Array.from(provinceSet),
      countries: Array.from(countrySet),
      locations: Array.from(addressSet),
      organizations: Array.from(organizationSet),
      // areas: Array.from(areaSet),
      otherSkills: Array.from(otherSkillsSet),
    });
  });

  router.post("/upload-image", uploadHandler.any(), async (req, res) => {
    console.log("--- UPLOADING FILE ---");
    const {
      query: { org, type, name },
    } = req;
    console.log("org:", org);
    console.log("type:", type);
    console.log("name:", name);

    const storage = new Storage({
      keyFilename: process.env.GCS_KEYFILE,
    });

    const filename = `companies/${org && org.toLowerCase()}/${type}/${name}`;
    console.log("UPLOADING FILE:", filename);
    console.log("BUCKET:", process.env.GCS_BUCKET);
    console.log("GCS_KEYFILE:", process.env.GCS_KEYFILE);

    await storage
      .bucket(process.env.GCS_BUCKET)
      .file(filename)
      .makePublic();

    return res
      .status(200)
      .send(
        `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${filename}`
      );
  });

  router.get("/:id", (req, res) => {
    const {
      params: { id },
    } = req;
    CauseModel.findById(id, async (err, doc) => {
      if (err) {
        return res
          .status(500)
          .send({ err: `Error finding Cause with id: ${id}` });
      }

      const locs = await LocationModel.find({ cause_id: id });
      if (locs && locs.length) {
        doc = {
          ...doc._doc,
          locations: locs,
        };
      }

      return res.status(200).send(doc);
    });
  });

  router.post("/", validateAdmin, getUserInfo, async (req, res) => {
    const createCauesReq = await CauseController.createCause(
      req.body,
      req.user
    );
    if (createCauesReq.status !== 200) {
      res.status(createCauesReq.status).send(createCauesReq.data.message);
      return;
    }
    const { data } = createCauesReq;
    res.status(createCauesReq.status).send(data);
  });

  router.patch("/:id", validateAdmin, getUserInfo, async (req, res) => {
    const {
      params: { id },
    } = req;
    const updateCaueReq = await CauseController.updateCause(
      id,
      req.body,
      req.user
    );
    if (updateCaueReq.status !== 200) {
      return res.status(updateCaueReq.status).send(updateCaueReq.data.message);
    }
    const { data } = updateCaueReq;
    res.status(updateCaueReq.status).send(data);
  });

  router.delete("/:id", validateAdmin, getUserInfo, async (req, res) => {
    CauseModel.findByIdAndDelete(req.params.id, (err, cause) => {
      if (err) {
        res.status(500);
        res.send(err);
      } else if (cause === null) {
        res.status(500);
        res.send({ message: "Caues id does not exist in mongo db" });
      } else {
        res.send({ message: "Cause successfully deleted!", id: cause._id });
      }
    });
  });

  router.delete("/", validateAdmin, (req, res) => {});

  return router;
};

module.exports = routes;
