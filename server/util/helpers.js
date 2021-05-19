
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

const buildFacet = (pageSize, pageToken) => {
  let facet = {};
  if (!pageSize) {
    facet = {
      metadata: [
        { $count: "total" },
        { $addFields: { page: 0 } }
      ],
      data: [
        { $sort: { created_date: -1 } },
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
        { $sort: { created_date: -1 } },
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
        { $sort: { created_date: -1 } },
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

module.exports = {
  buildQuery,
  buildUserInfo,
  buildFacet,
  buildAggregateQuery,
  buildAggregateQueryForArray
};