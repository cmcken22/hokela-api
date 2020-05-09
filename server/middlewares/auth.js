const dotenv = require('dotenv');
dotenv.config();

async function verifyAccessToken(req, res, next) {

}

async function getUserInfo(req, res, next) {
  return new Promise((resolve, reject) => {
    const { authorization } = req.headers;
    resolve(authorization);
  });
}

module.exports = { verifyAccessToken, getUserInfo }
