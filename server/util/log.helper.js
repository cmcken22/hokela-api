const util = require('util');

const logObject = (title = '', object) => {
  console.log(`${title}`, util.inspect(object, {
    showHidden: false,
    depth: null,
    colors: true
  }));
}

module.exports = {
  logObject
};