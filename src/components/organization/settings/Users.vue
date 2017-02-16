<template>
  <div>
    <md-list>
      <template v-for="(group, role) in groupedUsers">
        <md-subheader>{{$t('roles.' + role)}}</md-subheader>
        <md-list-item :class="'user-' + entry.uid" v-for="entry in group">
          <md-avatar>
            <img :src="users[entry.uid].photoURL">
          </md-avatar>
          <div class="md-list-text-container">
            <span>{{users[entry.uid].displayName}}
              <span class="md-caption" v-if="users[entry.uid].elevate">
                | <strong>{{$t('elevated')}}</strong>
                (+{{users[entry.uid].elevate}})
              </span></span>
            <span>
              {{users[entry.uid].email.split('@').shift()}}@<span :class="entry.domain ? 'md-primary' : ''">{{users[entry.uid].email.split('@').pop()}}
                <md-tooltip v-if="entry.domain">{{$t('roles.' + entry.domainRole) + ' ' + $tc('domain', 1)}}</md-tooltip>
              </span>
            </span>
          </div>
          <md-list-expand>
            <md-list>
              <template v-if="entry.uid !== auth.user.uid">
                <md-subheader class="md-inset">{{$t('changeStatus')}}</md-subheader>
                <md-list-item v-for="newRole in roles.concat('applicant', 'denied')" v-if="newRole !== role" class="md-inset" @click="changeRole(entry.uid, newRole, entry.domainRole)">
                  &nbsp;&nbsp;&nbsp;{{$t('roles.' + newRole)}}
                </md-list-item>
              </template>
              <md-subheader class="md-inset">
                {{$t('elevate')}}&nbsp;
                <md-icon style="cursor: help">
                  help_outline
                  <md-tooltip>{{$t('elevationInfo')}}</md-tooltip>
                </md-icon>
              </md-subheader>
              <md-list-item v-for="elevate in [null, 1, 2]" v-if="!(elevate === users[entry.uid].elevate || !elevate && !users[entry.uid].elevate)" class="md-inset" @click="setElevation(entry.uid, elevate)">
                &nbsp;&nbsp;&nbsp;{{elevate ? '+' + elevate : $t('unelevated')}}
              </md-list-item>
            </md-list>
          </md-list-expand>
        </md-list-item>
      </template>
    </md-list>
  </div>
</template>

<script>
  import Firebase from 'firebase';
  import auth from '../../../auth';
  import Config from '../../../models/Config';

  export default {
    props: ['organization'],
    data() {
      return {
        users: undefined,
        userRoles: undefined,
        domains: undefined,
        groupedUsers: {},
        roles: Config.roles,
        auth
      };
    },
    created() {
      const groupUsers = () => {
        if (!this.users || !this.userRoles || !this.domains) {
          return;
        }
        const groupedUsers = {};
        Object.keys(this.users).forEach((uid) => {
          const entry = { uid };
          let role = 'anyone';
          const emailDomain = this.users[uid].email.split('@').pop();
          if (this.userRoles.hasOwnProperty(uid)) {
            role = this.userRoles[uid];
            if (role === '?') {
              role = 'applicant';
            } else if (role === '!') {
              role = 'denied';
            }
          }
          Object.keys(this.domains).every((domainRole) => {
            const domain = this.domains[domainRole].find(roleDomain => (emailDomain === roleDomain));
            if (domain) {
              entry.domainRole = domainRole;
              entry.domain = domain;
              if (!role) {
                role = domainRole;
              }
              return false;
            }
            return true;
          });
          if (!groupedUsers.hasOwnProperty(role)) {
            groupedUsers[role] = [];
          }
          groupedUsers[role].push(entry);
        });
        this.groupedUsers = groupedUsers;
      };

      Firebase.database().ref('security/organizations/' + this.organization.key + '/domains').on('value', (snapshot) => {
        this.domains = snapshot.val() || {};
        groupUsers();
      });
      Firebase.database().ref('security/organizations/' + this.organization.key + '/users').on('value', (snapshot) => {
        this.userRoles = snapshot.val() || {};
        groupUsers();
      });
      Firebase.database().ref('organizations/' + this.organization.key + '/users').orderByChild('displayName').on('value', (snapshot) => {
        this.users = snapshot.val();
        groupUsers();
      });
    },
    methods: {
      changeRole(uid, newRole, domainRole) {
        const ref = Firebase.database().ref('security/organizations/' + this.organization.key + '/users/' + uid);
        if (newRole === domainRole) {
          ref.remove();
        } else {
          let finalRole = newRole;
          if (finalRole === 'applicant') {
            finalRole = '?';
          } else if (finalRole === 'denied') {
            finalRole = '!';
          }
          ref.set(finalRole);
        }
        const li = this.$el.querySelector('.user-' + uid);
        li.className = li.className.replace(/ md-active/, '');
      },
      setElevation(uid, elevate) {
        console.log(uid, elevate);
        Firebase.database().ref('organizations/' + this.organization.key + '/users/' + uid).update({ elevate });
      }
    }
  };
</script>