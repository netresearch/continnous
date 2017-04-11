function loadConnector(name) {
  return new Promise((resolve) => {
    /* eslint-disable global-require, import/no-dynamic-require */
    require(['./' + name + '/index'], (connector) => {
      resolve(connector.default);
    });
  });
}

export default class Connectors {
  static load(connector) {
    return loadConnector(connector);
  }
  static loadAll() {
    const promises = [];
    const connectors = {};
    ['jira-server'].forEach((name) => {
      promises.push(loadConnector(name).then((connector) => {
        connectors[name] = connector;
      }));
    });
    return Promise.all(promises).then(() => connectors);
  }
}
