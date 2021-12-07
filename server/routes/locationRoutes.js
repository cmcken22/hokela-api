const express = require('express');
const router = express.Router();

const { aggregateCausesWithLocations } = require('../util/helpers');

const routes = function () {
  router.get('/', async (req, res) => {
    const allData = await aggregateCausesWithLocations(req.query);

    console.log('\n----------');

    let allLocations = [];

    if (allData && allData.docs && allData.docs.length) {
      for (let i = 0; i < allData.docs.length; i++) {
        const { locations } = allData.docs[i];
        if (locations && locations.length) {
          allLocations = allLocations.concat(locations);
        }
      }
    }

    console.log('allLocations:', allLocations.length);

    return res.send({
      data: {
        docs: allLocations,
      }
    });
  });

  return router;
};

module.exports = routes;
