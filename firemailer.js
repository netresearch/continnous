/**
 * Flashlight config.js
 *
 * @see docker-compose.yml
 */

const appConfig = require('./src/models/Config.js');

const fs = require('fs');
const fbEnv = process.env.FB_ENV || 'production';
const fbrc = JSON.parse(fs.readFileSync('.firebaserc'));

['config', 'credentials', 'transports'].forEach((key) => {
  if (!fbrc[key]) {
    throw new Error('Missing ' + key + ' entry in .firebaserc');
  }
  if (!fbrc[key][fbEnv]) {
    throw new Error('Missing ' + key + ' entry for env ' + fbEnv + ' in .firebaserc');
  }
});

module.exports = {
  firebase: {
    url: fbrc.config[fbEnv].databaseURL,
    path: 'mails',
    serviceAccount: fbrc.credentials[fbEnv]
  },
  // Nodemailer transport configuration
  transport: fbrc.transports[fbEnv]
};
