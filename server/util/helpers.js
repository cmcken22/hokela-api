
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

module.exports = {
  buildQuery,
  buildUserInfo
};