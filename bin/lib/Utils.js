const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

require('colors');

const fbrc = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../.firebaserc')));
const FB_ENV = process.env.FB_ENV || 'production';
['config', 'credentials', 'transports'].forEach((key) => {
  if (!fbrc[key]) {
    throw new Error('Missing ' + key + ' entry in .firebaserc');
  }
  if (!fbrc[key][FB_ENV]) {
    throw new Error('Missing ' + key + ' entry for env ' + FB_ENV + ' in .firebaserc');
  }
});

const rc = {
  config: fbrc.config[FB_ENV],
  transport: fbrc.transports[FB_ENV]
};

admin.initializeApp(
  Object.assign({}, rc.config, { credential: admin.credential.cert(fbrc.credentials[FB_ENV]) })
);

module.exports = {
  rc,
  fb: admin
};
