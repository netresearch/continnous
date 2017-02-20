// CommonJS because required on CLI

const Config = require('./Config');

const refs = {
  get(path) {
    /* eslint-disable global-require */
    const Firebase = require('../firebase');
    /* eslint-enable global-require */
    return Firebase.database().ref(path);
  }
};

module.exports = class Permissions {
  constructor(permissions, defaultPermission) {
    this.organization = { read: false };
    this.set(permissions, defaultPermission);
  }

  set(permissions, defaultPermission) {
    Object.keys(Config.resources).forEach((r) => {
      [r, 'personal_' + r].forEach((resource) => {
        if (!this.hasOwnProperty(resource)) {
          this[resource] = {};
        }
        ['read', 'write'].forEach((privilege) => {
          if (permissions
            && permissions.hasOwnProperty(resource)
            && permissions[resource].hasOwnProperty(privilege)) {
            this[resource][privilege] = permissions[resource][privilege];
          } else {
            this[resource][privilege] = !!defaultPermission;
          }
        });
      });
    });
    return this;
  }

  bind(organization, user, callback) {
    if (refs.user) {
      refs.user.off('value');
    }
    if (refs.permissions) {
      refs.permissions.off('value');
    }
    this.role = undefined;
    if (organization && user) {
      const orgKey = typeof organization === 'object' ? organization.key : organization;
      refs.user = refs.get(
        '/security/organizations/' + orgKey + '/users/' + user.uid
      );
      refs.user.on('value', (snapshot) => {
        this.role = snapshot.val();
        if (organization && this.role !== '?' && this.role !== '!') {
          // Load permissions and set role for domain members (for whom snapshot.val() is null)
          const roles = this.role && this.role !== 'admin' ? [this.role] : Config.roles.slice(0);
          const loadPermissions = (role) => {
            if (refs.permissions) {
              refs.permissions.off('value');
            }
            refs.permissions = refs.get('/security/organizations/' + orgKey + '/permissions/' + role);
            refs.permissions.once('value',
              (permSnap) => {
                this.role = this.role === 'admin' ? this.role : role;
                this.set(permSnap.val());
                refs.permissions.on('value', (newPermSnap) => {
                  this.set(newPermSnap.val());
                });
                callback();
              },
              () => {
                if (roles.length) {
                  loadPermissions(roles.shift());
                } else {
                  this.set(undefined);
                  callback();
                }
              });
          };
          loadPermissions(roles.shift());
        } else {
          this.set(undefined);
          callback();
        }
      });
    } else {
      this.set(undefined);
      callback();
    }
  }

  static getDefaults() {
    const permissions = {};

    Config.roles.forEach((role) => {
      permissions[role] = {
        organization: {
          read: role === 'member'
        }
      };
      Object.keys(Config.resources).forEach((resource) => {
        [false, true].forEach((personal) => {
          const resourceName = (personal ? 'personal_' : '') + resource;
          const defaultPriviliges = Config.resources[resource]['default' + (personal ? 'Personal' : '') + 'Permissions'];
          permissions[role][resourceName] = {};
          ['read', 'write'].forEach((privilege) => {
            permissions[role][resourceName][privilege] =
              defaultPriviliges[role].indexOf(privilege) > -1;
          });
        });
      });
    });

    return permissions;
  }
};
