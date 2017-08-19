import extend from 'extend';
import Config from './Config';
import auth from '../auth';
import Firebase from '../firebase';
import Permissions from './Permissions';
import Organization from './Organization';

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
  id;
  resource;
  archive;
  personal;
  rawLinks;

  constructor(resource, id, data, archive, personal) {
    this.resource = resource;
    this.id = id;
    if (!resource || !id) {
      throw new Error('id and resource required');
    }
    if (data) {
      this.update(data);
    }

    this.archive = archive || data && data.archive || false;
    this.personal = personal || data && data.personal || false;
  }

  update(data) {
    Object.keys(this)
      .filter(key => ['id', 'resource', 'archive', 'personal'].indexOf(key) < 0)
      .forEach((key) => {
        delete this[key];
      });

    extend(true, this, data);

    // The links objects need to be given for proper binding
    // and we need to check if all links are allowed to be seen
    if (this.links) {
      this.rawLinks = extend(true, {}, this.links);
    } else {
      this.links = {};
    }
    const permissions = Permissions.current;
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
  }

  ref() {
    return Item.getFirebaseRef(
      this.resource,
      this.archive,
      this.personal,
      this.id
    );
  }

  prepareForFirebase() {
    const fbItem = extend(true, {}, this);
    delete fbItem.id;
    delete fbItem.resource;
    delete fbItem.personal;
    delete fbItem.archive;
    if (fbItem.rawLinks) {
      fbItem.links = fbItem.rawLinks;
    } else {
      delete fbItem.links;
    }
    delete fbItem.rawLinks;
    return fbItem;
  }

  /**
   * Load an Item ONCE
   *
   * @todo ? Find a nice way to load an item and keep it synced with on('value')
   *
   * @param {String} resource
   * @param {Boolean} archive
   * @param {Boolean} personal
   * @param {String} id
   * @param {String=} property
   * @return {Promise.<Item>}
   */
  static load(resource, archive, personal, id, property) {
    if (!id) {
      throw new Error('ID is required');
    }
    const load = tryArchiveOpposite => new Promise((resolve, reject) => {
      const ref = Item.getFirebaseRef(
        resource, tryArchiveOpposite ? !archive : archive, personal, id, property
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
          resolve(new Item(resource, id, data, archive, personal));
        }
      });
    });
    return load(false);
  }

  /**
   * @param {String} resource
   * @param {Boolean} archive
   * @param {Boolean} personal
   * @param {String=} id
   * @param {String=} property
   * @return {string}
   */
  static getFirebaseRef(resource, archive, personal, id, property) {
    return Firebase.database().ref(this.getFirebasePath(resource, archive, personal, id, property));
  }

  /**
   * @param {String} resource
   * @param {Boolean} archive
   * @param {Boolean} personal
   * @param {String=} id
   * @param {String=} property
   * @return {string}
   */
  static getFirebasePath(resource, archive, personal, id, property) {
    if (!resource) {
      throw new Error('No resource given');
    }
    return '/' + (archive ? 'archive' : 'resources')
      + '/organizations/' + Organization.current.key
      + '/' + (personal ? auth.user.uid : 'organization')
      + '/' + resource
      + (id ? '/' + id : '')
      + (property ? '/' + property : '');
  }
}
