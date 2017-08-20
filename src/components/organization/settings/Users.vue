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
              <template v-if="entry.uid !== Current.user.uid">
                <md-subheader class="md-inset">{{$t('changeStatus')}}</md-subheader>
                <md-list-item
                    v-for="newRole in roles.concat('applicant', 'denied')"
                    v-if="newRole !== role && (newRole !== 'applicant' || !users[entry.uid].inviteState)"
                    class="md-inset"
                    @click.native="changeRole(entry.uid, newRole, entry.domainRole)">
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
              <md-list-item v-for="elevate in [null, 1, 2]" v-if="!(elevate === users[entry.uid].elevate || !elevate && !users[entry.uid].elevate)" class="md-inset" @click.native="setElevation(entry.uid, elevate)">
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
  import Config from '../../../models/Config';
  import Current from '../../../models/Current';

  export default {
    data() {
      return {
        users: undefined,
        userRoles: undefined,
        domains: undefined,
        groupedUsers: {},
        roles: Config.roles,
        Current
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
          let role;
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
          if (!role) {
            role = 'anyone';
          }
          if (!groupedUsers.hasOwnProperty(role)) {
            groupedUsers[role] = [];
          }
          groupedUsers[role].push(entry);
        });
        this.groupedUsers = groupedUsers;
      };

      const org = Current.organization.key;
      Firebase.database().ref('security/organizations/' + org + '/domains').on('value', (snapshot) => {
        this.domains = snapshot.val() || {};
        groupUsers();
      });
      Firebase.database().ref('security/organizations/' + org + '/users').on('value', (snapshot) => {
        this.userRoles = snapshot.val() || {};
        groupUsers();
      });
      Firebase.database().ref('/users/organizations/' + org).orderByChild('displayName').on('value', (snapshot) => {
        this.users = snapshot.val();
        groupUsers();
      });
    },
    methods: {
      changeRole(uid, newRole, domainRole) {
        const org = Current.organization.key;
        const ref = Firebase.database().ref('security/organizations/' + org + '/users/' + uid);
        let finalRole = newRole;
        if (finalRole === 'applicant') {
          finalRole = '?';
        } else if (finalRole === 'denied') {
          finalRole = '!';
        }
        if (newRole === domainRole) {
          ref.remove();
        } else {
          ref.set(finalRole).then(() => {
            Firebase.database().ref('users/' + uid + '/organizations/' + org)
              .set(finalRole !== '?' && finalRole !== '!');
          });
        }
        if (this.users[uid].inviteState === -2) {
          // State -2 means admin was notified of invitation
          // State 2 means notify the user with the invite
          // @see InvitationStates
          Firebase.database().ref(
            '/users/organizations/' + org + '/' + uid + '/inviteState'
          ).set(2);
        }
        const li = this.$el.querySelector('.user-' + uid);
        li.className = li.className.replace(/ md-active/, '');
      },
      setElevation(uid, elevate) {
        const org = Current.organization.key;
        Firebase.database().ref('/users/organizations/' + org + '/' + uid).update({ elevate });
      }
    }
  };
</script>