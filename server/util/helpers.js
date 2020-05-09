const buildQuery = (req, mapOverride = {}) => {
  const keys = Object.keys(req.query);

  const validQueryMap = {
    form_path: 'path',
    status: 'status',
    name: 'name',
    group_id: 'group_id',
    form_group_id: 'form_group_id',
    project_id: 'project_id',
    ...mapOverride
  };

  let query = {};
  for (let i = 0; i < keys.length; i++) {
    let validQuery = validQueryMap[keys[i]];
    if (validQuery) {
      query = {
        ...query,
        [validQuery]: req.query[keys[i]]
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