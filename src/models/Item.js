import extend from 'extend';
import Config from './Config';
import auth from '../auth';
import Firebase from '../firebase';

/**
 * // Properties not in firebase:
 * @member {String} id
 * @member {Boolean=} archive
 * @member {Boolean=} personal
 * @member {String=} resource
 *
 * // Properties also in firebase
 * @member {String} title
 * @member {Object} links
 */
export default class Item {
  constructor(id, data, resource, archive, personal) {
    extend(true, this, data, { id, resource, archive, personal });

    let origLinks;

    // The links objects need to be given for proper binding
    // and we need to check if all links are allowed to be seen
    if (!this.links) {
      this.links = {};
    } else {
      origLinks = extend(true, {}, this.links);
    }

    this.setPermissions = (permissions) => {
      this.links = origLinks || {};
      Object.keys(Config.resources).forEach((key) => {
        const ar = permissions[key].read;
        const arp = permissions['personal_' + key].read;
        if (ar || arp) {
          if (!this.links[key]) {
            this.links[key] = {};
          }
          Object.keys(this.links[key]).forEach((target) => {
            const value = this.links[key][target];
            if (typeof value === 'object' && value.personal) {
              if (value.personal !== auth.user.uid || !arp) {
                delete this.links[key][target];
              } else {
                value.personal = true;
              }
            } else if (!ar) {
              delete this.links[key][target];
            }
          });
        } else {
          delete this.links[key];
        }
      });
      return this;
    };

    this.prepareForFirebase = () => {
      const fbItem = extend(true, {}, this);
      delete fbItem.resource;
      delete fbItem.personal;
      delete fbItem.archive;
      if (origLinks) {
        fbItem.links = origLinks;
      }
      return fbItem;
    };
  }

  /**
   * Load an Item ONCE
   *
   * @todo ? Find a nice way to load an item and keep it synced with on('value')
   *
   * @param {Organization} organization
   * @param {String} resource
   * @param {Boolean} archive
   * @param {Boolean} personal
   * @param {String} id
   * @param {String=} property
   * @return {Promise.<Item>}
   */
  static load(organization, resource, archive, personal, id, property) {
    if (!id) {
      throw new Error('ID is required');
    }
    const load = tryArchiveOpposite => new Promise((resolve, reject) => {
      const ref = Item.getFirebaseRef(
        organization, resource, tryArchiveOpposite ? !archive : archive, personal, id, property
      );
      ref.once('value', (sn) => {
        if (!sn.exists()) {
          if (tryArchiveOpposite) {
            reject();
          } else {
            load(true).then(resolve, reject);
          }
        } else {
          const data = property ? {} : sn.val();
          if (property) {
            data[property] = sn.val();
          }
          resolve(new Item(id, data, resource, archive, personal));
        }
      });
    });
    return load(false);
  }

  /**
   * @param {Organization} organization
   * @param {String} resource
   * @param {Boolean} archive
   * @param {Boolean} personal
   * @param {String=} id
   * @param {String=} property
   * @return {string}
   */
  static getFirebaseRef(...args) {
    return Firebase.database().ref(this.getFirebasePath(...args));
  }

  /**
   * @param {Organization} organization
   * @param {String} resource
   * @param {Boolean} archive
   * @param {Boolean} personal
   * @param {String=} id
   * @param {String=} property
   * @return {string}
   */
  static getFirebasePath(organization, resource, archive, personal, id, property) {
    const p = personal === undefined ? this.personal : personal;
    return '/' + (archive ? 'archive' : 'resources')
      + '/organizations/' + organization.key
      + '/' + (p ? auth.user.uid : 'organization')
      + '/' + resource
      + (id ? '/' + id : '')
      + (property ? '/' + property : '');
  }
}
