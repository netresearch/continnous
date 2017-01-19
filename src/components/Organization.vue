<template>
  <div id="organization">
    <md-app :toolbar-class="{'md-transparent': !organization}">
      <template slot="toolbar">
        <h2 class="md-title" style="flex: 1">{{organization ? organization.name : ''}}</h2>
        <account-switcher></account-switcher>
      </template>

      <template v-if="organization">
        <div class="app-content">
          <router-view :organization="organization" :permissions="permissions"></router-view>
        </div>

        <md-list slot="sidebar">
          <md-list-item class="menu-entry">
            <router-link :to="'/' + organization.key" exact>
              <md-icon>home</md-icon>
              <span>{{$t('overview')}}</span>
              <router-link v-if="role === 'admin'" :to="'/' + organization.key + '/settings'" class="md-button md-icon-button md-list-action">
                <md-icon>settings</md-icon>
                <md-tooltip>{{$t('settings')}}</md-tooltip>
              </router-link>
            </router-link>
          </md-list-item>
          <md-list-item v-for="(entry, key) in {objectives: { label: $tc('objective', 2), icon: 'rowing'}, ideas: { label: $tc('idea', 2), icon: 'lightbulb_outline'}}">
            <router-link :to="'/' + organization.key + '/' + key">
              <md-icon>{{entry.icon}}</md-icon>
              <span>{{entry.label}}</span>
              <router-link v-if="permissions[key].write || permissions['personal_' + key].write" :to="'/' + organization.key + '/' + key + '/create'" class="md-button md-icon-button md-list-action">
                <md-icon>add</md-icon>
              </router-link>
            </router-link>
          </md-list-item>
        </md-list>
      </template>
    </md-app>

    <md-message
        v-if="!organization"
        :status="organization === undefined || !auth.ready ? 0 : (organization === false ? -2 : (organization === null ? -1 : 1))"
        :timeout="0"
        splash>
      <div v-if="organization === null">
        {{$t('errors.404')}}
      </div>
      <div v-else-if="organization === false">
        <div>
          {{$t('errors.' + (auth.user ? 403 : 401))}}
        </div>
        <md-button :class="{'md-raised': true, 'md-primary': !auth.user || role}" @click="auth.login()">{{$t('auth.' + (auth.user ? 'switchAccount' : 'signIn'))}}</md-button>
        <md-button class="md-raised md-primary" v-if="auth.user && !role" @click="requestMembership">$t('auth.requestMembership')</md-button>
        <p v-else-if="auth.user && role">{{$t('auth.role' + (role === '!' ? 'Denied' : 'Processed'))}}.</p>
      </div>
    </md-message>
  </div>
</template>

<script>
  import Firebase from 'firebase';
  import auth from '../auth';
  import AccountSwitcher from './AccountSwitcher';
  import Organization from '../models/Organization';
  import Config from '../models/Config';

  const allDeniedPermissions = Config.getAllPermissionsWith(false);

  /* global document */
  const titleElement = document.querySelector('html > head > title');
  const defaultTitle = titleElement.innerHTML;

  export default {
    components: {
      AccountSwitcher
    },
    created() {
      this.fetchOrganization();
    },
    data() {
      return {
        organization: undefined,
        role: undefined,
        permissions: allDeniedPermissions,
        auth,
        title: undefined
      };
    },
    watch: {
      $route: 'fetchOrganization',
      'auth.user': 'fetchRoleAndPermissions',
      organization: 'fetchRoleAndPermissions'
    },
    methods: {
      fetchOrganization() {
        if (this.organization && this.organization.key === this.$route.params.organization_key) {
          return;
        }
        if (this.orgsRef) {
          this.orgsRef.off('value');
        }
        this.orgsRef = Firebase.database().ref('organizations/' + this.$route.params.organization_key);
        this.orgsRef.on('value',
          (snapshot) => {
            if (snapshot.val()) {
              this.organization = new Organization(snapshot.key, snapshot.val());
              this.$material.registerAndSetTheme(snapshot.key, this.organization.theme);
              this.title = this.organization.title || (this.organization.name + ' ' + this.$t('thisPlatform'));
              titleElement.innerText = this.title;
            } else {
              this.organization = null;
              titleElement.innerHTML = defaultTitle;
            }
          },
          () => {
            this.organization = false;
            this.fetchOrganization();
          }
        );
      },
      fetchRoleAndPermissions() {
        const user = this.auth.user;
        const orgKey = this.$route.params.organization_key;
        if (this.orgUsersRef) {
          this.orgUsersRef.off('value');
        }
        this.role = undefined;
        this.permissions = allDeniedPermissions;
        if (user) {
          this.orgUsersRef = Firebase.database().ref(
            '/security/organizations/' + orgKey + '/users/' + user.uid
          );
          this.orgUsersRef.on('value', (snapshot) => {
            this.role = snapshot.val();

            const updateUser = () => {
              if (this.role || this.organization) {
                Firebase.database().ref('/organizations/' + orgKey + '/users/' + user.uid).update({
                  email: user.email,
                  displayName: user.displayName,
                  photoURL: user.photoURL
                });
              }
            };

            if (this.organization && this.role !== '?' && this.role !== '!' && this.role !== 'admin') {
              // Load permissions and set role for domain members (for whom snapshot.val() is null)
              const roles = this.role ? [this.role] : Config.roles.slice(0);
              const loadPermissions = (role) => {
                Firebase.database().ref('/security/organizations/' + orgKey + '/permissions/' + role).once('value',
                  (permSnap) => {
                    this.role = role;
                    this.permissions = permSnap.val();
                    updateUser();
                  },
                  () => {
                    if (roles.length) {
                      loadPermissions(roles.shift());
                    } else {
                      updateUser();
                    }
                  });
              };
              loadPermissions(roles.shift());
            } else {
              if (this.role === 'admin') {
                this.permissions = Config.getAllPermissionsWith(true);
              }
              updateUser();
            }
          });
        }
      },
      requestMembership() {
        this.orgUsersRef.set('?');
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .menu-entry {
    background-color: #fafafa;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }
  .app-content {
    padding: 16px;
    > div > .md-toolbar,
    > div .md-tabs {
      margin:-16px -16px 16px;
    }
  }
</style>