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
      scoring: [],
      results: true,
      links: {
        ideas: {
          apart: true,
          priority: 1
        }
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
      },
      flashlight: {
      },
      periodical: false,
      scoring: ['strategy', 'need', 'impact', 'feasability', 'feel'],
      results: false,
      links: {
        ideas: true,
        insights: true
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
      },
      flashlight: {
      },
      periodical: false,
      scoring: [],
      results: false
    },
    roadmaps: {
      icon: 'format_list_bulleted',
      defaultPermissions: {
        member: ['read', 'write'],
        guest: ['read'],
        anyone: []
      },
      defaultPersonalPermissions: {
        member: ['read', 'write'],
        guest: ['read', 'write'],
        anyone: []
      },
      flashlight: {
      },
      periodical: false,
      scoring: [],
      results: false,
      links: {
        ideas: {
          exclusive: true,
          apart: true,
          all: true,
          priority: 2
        }
      }
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
