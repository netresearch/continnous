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
          assign: true,
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
        ideas: true
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
      results: false,
      links: {
        ideas: true
      }
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
          assign: true,
          priority: 2
        }
      }
    }
  },
  flashlight: {
    timeout: 3000,
    paths: {
      paths: '/flashlight-test',
      queries: '/flashlight/queries',
      results: '/flashlight/results'
    }
  },
};

module.exports = Config;
