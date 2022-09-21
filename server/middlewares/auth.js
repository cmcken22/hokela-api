const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
dotenv.config();

async function verifyAccessToken(req, res, next) {}

async function verifyApiKey(req, res, next) {
  if (req.headers && req.headers.api_key == process.env.API_KEY) return next();
  return res.status(401).send("Unauthorized");
}

function getUserInfo(req, res, next) {
  const { authorization } = req.headers;
  const [, accessToken] = authorization.split("Bearer ");
  const decoded = jwt.decode(accessToken);
  const { email } = decoded;

  req.user = {
    email: email,
    // name: "Conner McKenna"
  };
  next();
}

function validateAdmin(req, res, next) {
  // if (req.headers && req.headers.api_key == process.env.API_KEY) return next();
  // const { authorization } = req.headers;
  // const [, accessToken] = authorization.split('Bearer ');
  // const decoded = jwt.decode(accessToken);
  // const { hd } = decoded;

  // if (hd === 'hokela.ca') return next();

  if (validateAdminAccess(req)) {
    return next();
  }

  return res.status(503).send({
    error: "Access Denied!",
  });
}

const validateAdminAccess = (req) => {
  if (req.headers && req.headers.api_key == process.env.API_KEY) return true;
  const { authorization } = req.headers;
  if (!authorization) return false;
  const [, accessToken] = authorization.split("Bearer ");
  if (!accessToken) return false;
  const decoded = jwt.decode(accessToken);
  if (!decoded) return false;
  const { hd } = decoded;

  if (hd === "hokela.ca") return true;
  return false;
};

module.exports = {
  verifyAccessToken,
  validateAdmin,
  getUserInfo,
  verifyApiKey,
  validateAdminAccess,
};
