import Firebase from '../firebase';
import Connectors from '../connectors';

const connectionsByOrg = {};

export default class Connections {
  static getForOrganization(organization) {
    if (connectionsByOrg[organization.key]) {
      return Promise.resolve(connectionsByOrg[organization.key]);
    }
    const presentConnections = organization.connections
      ? Object.assign({}, organization.connections) : {};
    const connections = {};
    const loadConnection = (id, options) => Connectors
      .load(options.type)
      .then((Connector) => {
        connections[id] = new Connector(Object.assign({ id }, options));
      });

    const promises = [];
    Object.keys(presentConnections).forEach((key) => {
      promises.push(loadConnection(key, presentConnections[key]));
    });
    connectionsByOrg[organization.key] = Promise.all(promises).then(() => {
      connectionsByOrg[organization.key] = new Connections(connections);
      return connectionsByOrg[organization.key];
    });

    const ref = Firebase.database().ref('/organizations/' + organization.key + '/connections');
    ref.limitToLast(1).on('child_added', (sn) => {
      if (!presentConnections[sn.key]) {
        loadConnection(sn.key, sn.val());
      }
    });
    ref.on('child_changed', (sn) => {
      loadConnection(sn.key, sn.val());
    });
    ref.on('child_removed', (sn) => {
      delete connections[sn.key];
    });

    return connectionsByOrg[organization.key];
  }

  connections = {};

  constructor(connections) {
    this.connections = connections;
  }

  all() {
    return this.connections;
  }

  filter(filterFunc) {
    const connections = {};
    Object.keys(this.connections).forEach((key) => {
      if (filterFunc(this.connections[key])) {
        connections[key] = this.connections[key];
      }
    });
    return connections;
  }
}
