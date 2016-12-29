export default {
  roles: ['member', 'guest', 'anyone'],
  getDefaultPermissions() {
    const defaultPermissions = {};
    const availableResources = {
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
      defaultPermissions[role] = {};
      Object.keys(availableResources).forEach((resource) => {
        defaultPermissions[role][resource] = {};
        availableResources[resource].forEach((privilege) => {
          defaultPermissions[role][resource][privilege] =
            roles[role][resource] && roles[role][resource].indexOf(privilege) > -1;
        });
      });
    });

    return defaultPermissions;
  }
};
