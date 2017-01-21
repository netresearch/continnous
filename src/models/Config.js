// CommonJS because required on CLI

const Config = {
  roles: ['member', 'guest', 'anyone'],
  resources: {
    objectives: {
      icon: 'rowing',
      defaultPermissions: {
        member: ['read'],
        guest: [],
        anyone: []
      },
      defaultPersonalPermissions: {
        member: ['read', 'write'],
        guest: [],
        anyone: []
      }
    },
    ideas: {
      icon: 'lightbulb_outline',
      defaultPermissions: {
        member: ['read', 'write'],
        guest: ['write'],
        anyone: ['write']
      },
      defaultPersonalPermissions: {
        member: ['read', 'write'],
        guest: ['read', 'write'],
        anyone: []
      }
    },
    insights: {
      icon: 'chat_bubble_outline',
      defaultPermissions: {
        member: ['read', 'write'],
        guest: ['write'],
        anyone: ['write']
      },
      defaultPersonalPermissions: {
        member: ['read', 'write'],
        guest: ['read', 'write'],
        anyone: []
      }
    }
  },
  flashlight: {
    paths: {
      paths: '/flashlight/paths',
      queries: '/flashlight/queries',
      results: '/flashlight/results'
    }
  },
  getDefaultPermissions() {
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
  },
  getAllPermissionsWith(value) {
    const permissions = { organization: { read: false } };
    Object.keys(Config.resources).forEach((resource) => {
      permissions[resource] = {
        read: value,
        write: value
      };
      permissions['personal_' + resource] = {
        read: value,
        write: value
      };
    });
    return permissions;
  }
};

module.exports = Config;
