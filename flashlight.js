/**
 * Flashlight config.js
 *
 * @see docker-compose.yml
 */

const appConfig = require('./src/models/Config.js');

const fs = require('fs');
const fbConfig = JSON.parse(fs.readFileSync('.firebaserc')).config;

module.exports = {
  paths: appConfig.flashlight.paths.paths || [],

  FB_URL: fbConfig.databaseURL,
  FB_REQ: appConfig.flashlight.paths.queries,
  FB_RES: appConfig.flashlight.paths.results,
  FB_SERVICEACCOUNT: JSON.parse(fs.readFileSync('service-account.json')),

  ES_HOST: process.env.ES_HOST || 'localhost',
  ES_PORT: process.env.ES_PORT || '9200',
  // ElasticSearch username for http auth
  ES_USER: process.env.ES_USER || null,
  // ElasticSearch password for http auth
  ES_PASS: process.env.ES_PASS || null,
  // Additional options for ElasticSearch client
  ES_OPTS: {
    //requestTimeout: 60000, maxSockets: 100, log: 'error'
  },
  CLEANUP_INTERVAL: process.env.NODE_ENV === 'production' ?
    3600 * 1000 /* once an hour */ :
    60 * 1000 /* once a minute */
};
