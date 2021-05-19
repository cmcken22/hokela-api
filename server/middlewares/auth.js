const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();

async function verifyAccessToken(req, res, next) {

}

function getUserInfo(req, res, next) {
  const { authorization } = req.headers;
  const [, accessToken] = authorization.split('Bearer ');
  const decoded = jwt.decode(accessToken);
  const { email } = decoded;

  req.user = {
    email: email,
    // name: "Conner McKenna"
  };
  next();
}

function validateAdmin(req, res, next) {
  const { authorization } = req.headers;
  const [, accessToken] = authorization.split('Bearer ');
  const decoded = jwt.decode(accessToken);
  const { hd } = decoded;

  if (hd === 'hokela.ca') return next();

  return res.status(503).send({
    error: 'Access Denied!'
  });
}

module.exports = {
  verifyAccessToken,
  validateAdmin,
  getUserInfo
}
