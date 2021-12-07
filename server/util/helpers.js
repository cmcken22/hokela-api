
const CauseModel = require('../models/causeModel');

const formatMultiSearchQuery = (key, value) => {
  const values = value.split(',');
  let result = values.map(v => {
    return { [key]: { $eq: v } };
  });
  let query = { 
    $or: result
  };
  return query;
}

const buildQuery = (query, mapOverride = {}) => {
  const keys = Object.keys(query);

  // console.log('\n-------------');

  const validQueryMap = {
    status: 'status',
    name: 'name',
    cause_id: 'cause_id',
    organization: 'organization',
    locations: 'locations',
    sector: 'sector',
    time_of_day: 'time_of_day',
    duration: 'duration',
    skill: 'skill',
    ages: 'ages',
    days: 'days',
    ideal_for: 'ideal_for',
    ...mapOverride
  };

  let queryRes = {};
  for (let i = 0; i < keys.length; i++) {
    let validQuery = validQueryMap[keys[i]];

    if (validQuery) {
      let value = query[keys[i]];
      if (typeof value === 'string' && value.indexOf('[') !== -1) {
        const array = JSON.parse(value);
        let val = { $or: [] };
        for (let i = 0; i < array.length; i++) {
          const loc = array[i];
          const [city, province] = loc.split(',');
          let obj = {
            city
          };
          if (!!province) {
            obj = {
              ...obj,
              $and: [{
                province
              }]
            }
          }
          val.$or.push(obj);
        }

        queryRes = {
          ...queryRes,
          ...val,
        };
      } else if (typeof value === 'string' && value.indexOf(',') !== -1) {
        value = formatMultiSearchQuery(keys[i], value);
        queryRes = {
          ...queryRes,
          ...value
        };
      } else {
        queryRes = {
          ...queryRes,
          [validQuery]: value
        };
      }
    }
  }
  return queryRes;
}

const buildUserInfo = (res) => {
  let user = {};
  if (res && res.locals && res.locals.user) {
    user = {
      ...res.locals.user
    };
  }
  return user;
}

const buildFacet = (pageSize, pageToken, createdDateSortOrder) => {
  let facet = {};
  if (!pageSize) {
    facet = {
      metadata: [
        { $count: "total" },
        { $addFields: { page: 0 } }
      ],
      data: [
        { $sort: { created_date: createdDateSortOrder } },
        { $skip: 0 },
        { $limit: 10000000 }
      ]
    };
  } else if (!!pageSize && !pageToken) {
    facet = {
      metadata: [
        { $count: "total" },
        { $addFields: { page: 0 } }
      ],
      data: [
        { $sort: { created_date: createdDateSortOrder } },
        { $skip: 0 },
        { $limit: JSON.parse(pageSize) }
      ]
    };
  } else if (!!pageSize && !!pageToken) {
    const decodedPageToken = pageToken !== undefined ? JSON.parse(Base64.decode(pageToken)) : null;
    if (!!pageSize && !!decodedPageToken) {
      if (decodedPageToken.page_size !== pageSize) {
        return res.status(400).send('Page size does not match!');
      }
    }
    facet = {
      metadata: [
        { $count: "total" },
        { $addFields: { page: decodedPageToken.page_offset } }
      ],
      data: [
        { $sort: { created_date: createdDateSortOrder } },
        { $skip: pageSize * decodedPageToken.page_offset },
        { $limit: JSON.parse(pageSize) }
      ]
    };
  }

  return facet;
}

const buildAggregateQuery = (value, name) => {
  const splitValues = value.split(',');
  let values = [];
  for (let i = 0; i < splitValues.length; i++) {
    const _value = splitValues[i];
    values.push({
      $eq: [`$${name}`, _value]
    });
  }
  return values;
}

const buildAggregateQueryForArray = (options, field) => {
  let filters = null;
  if (!!options) {
    const arr = [];
    const splitOptions = options.split(',');
    for (let i = 0; i < splitOptions.length; i++) {
      const value = splitOptions[i];
      arr.push({
        [field]: { $in: [value, `$${field}`] },
      });
    }
    filters = {
      $match: {
        $or: [...arr]
      }
    };
  }
  return filters;
}

const aggregateCausesWithLocations = (query) => {
  return new Promise(async (resolve) => {
    const {
      page_token: pageToken,
      page_size: pageSize,
      locations,
      sector,
      time_of_day,
      duration,
      skill,
      organization,
      ages,
      days,
      ideal_for,
      search,
      sort_by
    } = query; 

    const facet = buildFacet(pageSize, pageToken, sort_by === 'desc' ? 1 : -1);

    // TODO: build this array if other queries come in
    const causeFilters = [
      { $expr: { $eq: ["$status", "ACTIVE"] } }
    ];

    if (!!sector) {
      const values = buildAggregateQuery(sector, "sector");
      causeFilters.push({
        $expr: { $or: [...values] },
      });
    }
    if (!!duration) {
      const values = buildAggregateQuery(duration, "duration");
      causeFilters.push({
        $expr: { $or: [...values] },
      });
    }
    if (!!organization) {
      const values = buildAggregateQuery(organization, "organization");
      causeFilters.push({
        $expr: { $or: [...values] },
      });
    }
    if (!!ages) {
      const values = buildAggregateQuery(ages, "ages");
      causeFilters.push({
        $expr: { $or: [...values] },
      });
    }
    if (!!skill) {
      const values = buildAggregateQuery(skill, "area");
      causeFilters.push({
        $expr: { $or: [...values] },
      });
    }

    const dayFilters = buildAggregateQueryForArray(days, 'days');
    const timeOfDayFilters = buildAggregateQueryForArray(time_of_day, 'time_of_day');
    const idealForFilters = buildAggregateQueryForArray(ideal_for, 'ideal_for');

    let fieldsToProject = {};
    for (let key in CauseModel.schema.paths) {
      if (key !== '_id') {
        fieldsToProject = {
          ...fieldsToProject,
          [key]: `$${key}`
        }
      }
    }

    const pipeline = [
      {
        $match: {
          $and: [...causeFilters]
        },
      },
      {
        $project: {
          _id: {
            $toString: "$_id"
          },
          ...fieldsToProject
        }
      },
      {
        $lookup: {
          from: "locations",
          localField: "_id",
          foreignField: "cause_id",
          as: "locations"
        }
      }
    ];
    if (!!dayFilters) pipeline.push(dayFilters);
    if (!!timeOfDayFilters) pipeline.push(timeOfDayFilters);
    if (!!idealForFilters) pipeline.push(idealForFilters);

    if (!!search) {
      const nameRegex = new RegExp("^.*" + search + ".*$");
      pipeline.push({
        $match: {
          $or: [
            {
              "name": { $regex: nameRegex, $options: "i" },
            },
            {
              "organization": { $regex: nameRegex, $options: "i" }
            }
          ]
        }
      });
    }

    if (!!locations) {
      const parsedLocations = JSON.parse(locations);
      let locationQueries = [];
      for (let i = 0; i < parsedLocations.length; i++) {
        const location = parsedLocations[i];
        const [city, province] = location.split(',');
        if (city === 'Remote') {
          locationQueries.push({
            $and: [
              { 'locations.city': { $exists: true, $in: [city] } },
            ]
          });
        } else {
          locationQueries.push({
            $and: [
              { 'locations.city': { $exists: true, $in: [city] } },
              { 'locations.province': { $exists: true, $in: [province] } }
            ]
          });
        }
      }

      pipeline.push({
        "$match": {
          $or: [...locationQueries]
        }
      });
    }

    pipeline.push({
      $facet: {
        ...facet
      }
    });

    CauseModel.aggregate([...pipeline], (err, data) => {
      if (err) {
        console.log('ERROR:', err);
        return resolve(null);
      }

      return resolve({
        docs: data[0].data,
        metaData: data[0].metadata
      });
    });

  });
}

module.exports = {
  buildQuery,
  buildUserInfo,
  buildFacet,
  buildAggregateQuery,
  buildAggregateQueryForArray,
  aggregateCausesWithLocations
};