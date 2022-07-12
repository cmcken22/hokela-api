const path = require('path');
const fs = require('fs');
const formatString = require('string-template');

const templates = {
  thankYou: (variables = {}) => {
    const filePath = path.resolve(__dirname, './thankYou.html');
    const data = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
    const html = formatString(data, { ...variables });
    return html;
  },
  followUp: (variables = {}) => {
    const filePath = path.resolve(__dirname, './followUp.html');
    const data = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
    const html = formatString(data, { ...variables });
    return html;
  },
  contactUs: (variables = {}) => {
    const filePath = path.resolve(__dirname, './contactUs.html');
    const data = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
    const html = formatString(data, { ...variables });
    return html;
  },
  thankYouForContactingUs: (variables = {}) => {
    const filePath = path.resolve(__dirname, './thankYouForContactingUs--simple.html');
    const data = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
    const html = formatString(data, { ...variables });
    return html;
  }
}

module.exports = { templates };