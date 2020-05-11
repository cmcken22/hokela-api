const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
dotenv.config();

async function verifyAccessToken(req, res, next) {

}

async function getUserInfo(req, res, next) {
  return new Promise((resolve, reject) => {
    const { authorization } = req.headers;
    const [, accessToken] = authorization.split('Bearer ');
    const decoded = jwt.decode(accessToken, process.env.SIGNING_SECRET);
    const { email, name } = decoded;
    req.user = {
      email,
      name
    };
    next();
  });
}

module.exports = { verifyAccessToken, getUserInfo }
