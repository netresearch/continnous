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
      },
      transitions: {
        occasions: ['discarded', 'completed'],
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
      },
      transitions: {
        occasions: ['discarded', 'accepted', 'completed'],
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
      },
      transitions: {
        occasions: ['discarded', 'heeded', 'outdated'],
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
      },
      transitions: {
        occasions: ['discarded', 'completed'],
      },
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
