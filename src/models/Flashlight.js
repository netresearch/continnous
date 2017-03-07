// CommonJS because required on CLI

const Config = require('./Config');

module.exports = class Flashlight {
  constructor(organization, permissions, auth) {
    this.organization = organization;
    this.permissions = permissions;
    this.auth = auth;
    /* eslint-disable global-require */
    const Firebase = require('../firebase');
    /* eslint-enable global-require */
    this.queriesRef = Firebase.database().ref(Config.flashlight.paths.queries);
    this.resultsRef = Firebase.database().ref(Config.flashlight.paths.results);
  }

  search(query, ...resources) {
    const promises = [];

    this.lastQuery = query;

    (resources[0] === '*' ? Object.keys(Config.resources) : resources).forEach((r) => {
      (resources[0] === '*' ? [r, 'personal_' + r] : [r]).forEach((resource) => {
        if (resources.indexOf(resource) > -1 || this.permissions[resource].read) {
          promises.push(new Promise((resolve, reject) => {
            if (!this.permissions[resource].read) {
              reject('No permission on resource ' + resource);
              return;
            }
            let results = false;
            const finalQuery = Object.assign({
              index: this.organization.key,
              type: resource
            }, query);
            const queryRef = this.queriesRef.push(finalQuery);
            const resultsRef = this.resultsRef.child(queryRef.key);
            const handler = (snapshot) => {
              results = true;
              const result = snapshot.val();
              if (result) {
                if (result.error) {
                  reject(result);
                } else {
                  resolve(Object.assign({ resource }, result));
                }
                resultsRef.off('value', handler);
                resultsRef.remove();
              }
            };
            resultsRef.on('value', handler, reject);
            /* global window */
            window.setTimeout(() => {
              if (!results) {
                resultsRef.off('value', handler);
                queryRef.remove();
                reject('Request timed out');
              }
            }, Config.flashlight.timeout);
          }));
        }
      });
    });
    return new Promise((resolve, reject) => {
      Promise.all(promises).then(
        (results) => {
          if (query !== this.lastQuery) {
            return;
          }
          const filteredResults = [];
          filteredResults.query = query;
          results.forEach((result) => {
            if (result.hits.total) {
              filteredResults.push({
                resource: result.resource,
                total: result.hits.total,
                hits: result.hits.hits
              });
            }
          });
          resolve(filteredResults);
        },
        reject
      );
    });
  }

  static getPaths(orgKey, key, permissions) {
    const paths = {};
    Object.keys(Config.resources).forEach((resource) => {
      const pathKey = 'organization-' + orgKey + '-' + key + '-' + resource;
      const type = (key === 'organization' ? '' : 'personal_') + resource;
      if (permissions && permissions[type] && permissions[type].read) {
        paths[pathKey] = {
          path: '/resources/organizations/' + orgKey + '/' + key + '/' + resource,
          index: orgKey,
          type,
          fields: Config.resources[resource].flashlight.fields || null
        };
      } else {
        paths[pathKey] = null;
      }
    });
    return paths;
  }

  static updatePaths(orgKey, key, permissions) {
    /* eslint-disable global-require */
    const Firebase = require('../firebase');
    /* eslint-enable global-require */
    return Firebase.database().ref(Config.flashlight.paths.paths).update(
      Flashlight.getPaths(orgKey, key, permissions)
    );
  }
};
