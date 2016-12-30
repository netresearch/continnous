// CommonJS because required on CLI

module.exports = {
  roles: ['member', 'guest', 'anyone'],
  getDefaultPermissions() {
    const permissions = {};
    const resources = {
      organization: ['read'],
      objectives: ['read', 'write'],
      personal_objectives: ['read', 'write'],
      ideas: ['read', 'write'],
      personal_ideas: ['read', 'write']
    };
    const roles = {
      member: {
        objectives: ['read'],
        personal_objectives: ['read', 'write'],
        ideas: ['read', 'write'],
        personal_ideas: ['read', 'write']
      },
      guest: {
        ideas: ['write'],
        personal_ideas: ['read', 'write']
      },
      anyone: {
        ideas: ['write']
      }
    };

    Object.keys(roles).forEach((role) => {
      permissions[role] = {};
      Object.keys(resources).forEach((resource) => {
        permissions[role][resource] = {};
        resources[resource].forEach((privilege) => {
          if (roles[role][resource]) {
            permissions[role][resource][privilege] = roles[role][resource].indexOf(privilege) > -1;
          } else {
            permissions[role][resource][privilege] = false;
          }
        });
      });
    });

    return permissions;
  }
};
