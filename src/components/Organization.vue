<template>
  <div id="organization" class="full-height">
    <md-app
        :toolbar-class="{'md-transparent': !organization}" class="scroll-container" content-class="full-height"
        :search="$t('actions.search')"
        @search="handleSearch"
        :q="$route.query.q"
    >
      <template slot="title">
        <h2 class="md-title">{{title}}</h2>
      </template>
      <template slot="actions">
        <account-switcher></account-switcher>
      </template>

      <template v-if="organization">
        <div class="app-content full-height">
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
          <md-list-item v-for="(resource, key) in resources" v-if="permissions[key].write || permissions['personal_' + key].write || permissions[key].read || permissions['personal_' + key].read">
            <router-link :to="'/' + organization.key + '/' + key">
              <md-icon>{{resource.icon}}</md-icon>
              <span>{{$t('resources.' + key)}}</span>
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
  import Permissions from '../models/Permissions';
  import Flashlight from '../models/Flashlight';

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
        permissions: new Permissions(),
        resources: Config.resources,
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
              this.title = null;
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
        this.$nextTick(() => {
          const user = this.auth.user;
          const orgKey = this.$route.params.organization_key;
          this.permissions.bind(this.organization, user, () => {
            this.role = this.permissions.role;
            if (this.role || this.organization) {
              // Update user
              Firebase.database().ref('/organizations/' + orgKey + '/users/' + user.uid).update({
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
              });
            }
            if (this.organization && user) {
              // Update flashlight index paths
              Flashlight.updatePaths(orgKey, user.uid, this.permissions);
            }
          });
        });
      },
      requestMembership() {
        this.orgUsersRef.set('?');
      },
      handleSearch(search) {
        const path = '/' + this.organization.key + '/search';
        if (search === false) {
          this.$router.replace(this.previousRoute || '/' + this.organization.key);
        } else {
          const query = Object.assign({}, this.$route.query);
          if (search) {
            query.q = search;
          } else if (query.q) {
            delete query.q;
          }
          if (this.$route.path.substr(0, path.length) !== path) {
            this.previousRoute = { path: this.$route.path, query: this.$route.query };
            this.$router.push({ path, query });
          } else {
            this.$router.replace({ query });
          }
        }
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .menu-entry {
    background-color: #fafafa;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }
  .app-content .scroll-content {
    padding: 16px;
  }
</style>