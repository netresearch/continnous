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
      },
      flashlight: {
      },
      periodical: true,
      scoring: []
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
      },
      flashlight: {
      },
      periodical: false,
      scoring: ['strategy', 'need', 'impact', 'feasability', 'feel']
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
      },
      flashlight: {
      },
      periodical: false,
      scoring: []
    }
  },
  flashlight: {
    timeout: 3000,
    paths: {
      paths: '/flashlight/paths',
      queries: '/flashlight/queries',
      results: '/flashlight/results'
    }
  },
};

module.exports = Config;
