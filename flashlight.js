/**
 * Flashlight config.js
 *
 * @see docker-compose.yml
 */

const appConfig = require('./src/models/Config.js');

const fs = require('fs');
const fbEnv = process.env.FB_ENV || 'production';
const fbrc = JSON.parse(fs.readFileSync('.firebaserc'));

['config', 'credentials'].forEach((key) => {
  if (!fbrc[key]) {
    throw new Error('Missing ' + key + ' entry in .firebaserc');
  }
  if (!fbrc[key][fbEnv]) {
    throw new Error('Missing ' + key + ' entry for env ' + fbEnv + ' in .firebaserc');
  }
});

// That's so ugly but as flashlight doesn't export anything ¯\_(ツ)_/¯
fs.appendFileSync('./lib/PathMonitor.js', '\n\nexports.PathMonitor = PathMonitor;');

const vm = require('vm');
require('colors');
const PathMonitor = require('./lib/PathMonitor').PathMonitor;
PathMonitor.prototype._process = function(fn, snap) {
  const snVal = snap.val();
  const snKey = snap.key;

  if (fn === this._childRemoved) {
    this._childRemoved(snKey, snVal);
    if (this.filterRefs) {
      const filterRefs = this.filterRefs;
      Object.keys(filterRefs).forEach((path) => {
        delete filterRefs[path].keys[key];
        if (!Object.keys(filterRefs[path].keys).length) {
          filterRefs[path].ref.off('value');
          delete filterRefs[path];
        }
      });
    }
    return;
  }

  if (typeof this.filter === 'string') {
    if (!this.filterScript) {
      try {
        this.filterScript = new vm.Script('RESULT = ' + this.filter, {
          filename: this.ref.toString() + '/filter',
          displayErrors: true
        });
      } catch (e) {
        console.error('Error in filter expression:'.red);
        console.error(e);
        this.filter = () => false;
        return;
      }
      this.filterRefs = {};
    }

    const filterRefs = this.filterRefs;
    let load = {};
    const invalidPathErrors = [];
    const paths = {};
    const context = vm.createContext({
      ref: function (path) {
        if (typeof path !== 'string' || !path) {
          throw new Error('INVALID_PATH');
        }
        if (filterRefs[path]) {
          paths[path] = true;
          return filterRefs[path].val;
        }
        load[path] = true;
        throw new Error('LOADING_REF');
      },
      data: snVal,
      $id: snKey,
      RESULT: false
    });
    const run = () => {
      try {
        this.filterScript.runInContext(context);
      } catch (e) {
        if (e.message === 'INVALID_PATH') {
          if (invalidPathErrors.indexOf(e.toString()) < 0) {
            invalidPathErrors.push(e.toString());
          } else {
            console.error('Invalid path at %s'.red, this.filter);
            console.error(e);
            return;
          }
        } else if (e.message !== 'LOADING_REF') {
          console.error('Error at %s'.red, this.filter);
          console.error(e);
          return;
        }
      }
      const promises = [];
      Object.keys(load).forEach((path) => {
        promises.push(new Promise((resolve, reject) => {
          const ref = this.ref.root.child(path);
          let initial = true;
          ref.on('value', (sn) => {
            if (initial) {
              initial = false;
              filterRefs[path] = { ref, keys: {}, val: sn.val() };
              resolve();
            } else {
              filterRefs[path].val = sn.val();
              Object.keys(filterRefs[path].keys).forEach((key) => {
                this.ref.child(key).once('value', this._process.bind(
                  this, filterRefs[path].keys[key] ? this._childChanged : this._childAdded
                ));
              });
            }
          }, (e) => {
            console.error('Firebase error at %s'.red, this.filter);
            console.error(e);
            if (initial) {
              initial = false;
              reject();
            }
          });
        }));
      });
      load = {};
      if (promises.length) {
        Promise.all(promises).then(run, () => {});
      } else {
        Object.keys(paths).forEach((path) => {
          filterRefs[path].keys[snKey] = context.RESULT;
        });
        if (context.RESULT) {
          fn.call(this, snKey, this.parse(snVal));
        } else if (fn === this._childChanged) {
          this._childRemoved(snKey, snVal);
        }
      }
    };
    run();
  } else if (this.filter(snVal)) {
    fn.call(this, snKey, this.parse(snVal));
  }
};
PathMonitor.prototype._oldStop = PathMonitor.prototype._stop;
PathMonitor.prototype._stop = function () {
  this._oldStop();
  if (this.filterRefs) {
    Object.keys(this.filterRefs).forEach((path) => {
      this.filterRefs[path].ref.off('value');
    });
    this.filterRefs = {};
  }
};

module.exports = {
  paths: appConfig.flashlight.paths.paths || [],

  FB_URL: fbrc.config[fbEnv].databaseURL,
  FB_REQ: appConfig.flashlight.paths.queries,
  FB_RES: appConfig.flashlight.paths.results,
  FB_SERVICEACCOUNT: fbrc.credentials[fbEnv],

  ES_HOST: process.env.ES_HOST || 'localhost',
  ES_PORT: process.env.ES_PORT || '9200',
  // ElasticSearch username for http auth
  ES_USER: process.env.ES_USER || null,
  // ElasticSearch password for http auth
  ES_PASS: process.env.ES_PASS || null,
  // Additional options for ElasticSearch client
  ES_OPTS: {
    // requestTimeout: 60000, maxSockets: 100, log: 'error'
  },
  CLEANUP_INTERVAL: process.env.NODE_ENV === 'production' ?
    3600 * 1000 /* once an hour */ :
    60 * 1000 /* once a minute */
};
