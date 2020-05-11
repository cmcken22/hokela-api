
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

const buildQuery = (req, mapOverride = {}) => {
  const keys = Object.keys(req.query);

  const validQueryMap = {
    status: 'status',
    name: 'name',
    cause_id: 'cause_id',
    ...mapOverride
  };

  let query = {};
  for (let i = 0; i < keys.length; i++) {
    let validQuery = validQueryMap[keys[i]];

    if (validQuery) {
      let value = req.query[keys[i]];
      if (value.indexOf(',') !== -1) {
        value = formatMultiSearchQuery(keys[i], value);
        query = {
          ...query,
          ...value
        }
      } else {
        query = {
          ...query,
          [validQuery]: value
        }
      }
    }
  }
  return query;
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