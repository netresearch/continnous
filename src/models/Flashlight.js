// CommonJS because required on CLI

const Config = require('./Config');

module.exports = class Flashlight {
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
