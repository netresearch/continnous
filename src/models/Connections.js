import Firebase from '../firebase';
import Connectors from '../connectors';

const connectionsByOrg = {};

/**
 * Basically only an object, containing Connector instances
 *
 * @todo Find a way to comfortably load only desired connectors
 *       but allow to retrieve all when necessary as well
 */
export default class Connections {
  static getForOrganization(organization) {
    if (connectionsByOrg[organization.key]) {
      return Promise.resolve(connectionsByOrg[organization.key]);
    }
    const presentConnections = organization.connections
      ? Object.assign({}, organization.connections) : {};
    const connections = new Connections();
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
      connectionsByOrg[organization.key] = connections;
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

  filter(filterFunc) {
    const connections = {};
    Object.keys(this).forEach((key) => {
      if (filterFunc(this[key], key)) {
        connections[key] = this[key];
      }
    });
    return connections;
  }
}
