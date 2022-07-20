const ApplicationModel = require('../models/applicationModel');
const { getToggleState } = require('../util/helpers');

async function alreadyApplied(req, res, next) {
  const {
    body: {
      cause_id,
      location_id,
      user : { email }
    },
  } = req;

  const preventAlreadyAppliedCheck = await getToggleState('prevent_already_applied_check');
  if (preventAlreadyAppliedCheck) return next();

  const application = await ApplicationModel.find({ email, cause_id, location_id });
  if (application && application.length) {
    return res.status(500).send({
      error: `User (${email}) has already applied to this cause (${cause_id}) at this location (${location_id})`
    });
  }

  return next();
}

module.exports = { alreadyApplied };