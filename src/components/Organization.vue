<template>
  <div id="organization" class="full-height">
    <md-app
        :toolbar-class="{'md-transparent': !organization}" class="scroll-container" content-class="full-height"
        :search="$t('actions.search')"
        @search="handleSearch"
        :q="$route.query.q"
        v-if="organization && auth.user"
    >
      <template slot="title">
        <h2 class="md-title">{{title}}</h2>
      </template>
      <template slot="actions">
        <md-menu md-size="6" md-direction="bottom left">
          <md-button class="md-icon-button" md-menu-trigger>
            <md-icon>whatshot</md-icon>
          </md-button>
          <md-menu-content class="md-dense">
            <journal :organization="organization"></journal>
          </md-menu-content>
        </md-menu>
        <account-switcher></account-switcher>
      </template>

      <div class="app-content full-height">
        <router-view :organization="organization" :permissions="permissions"></router-view>
      </div>

      <md-list slot="sidebar">
        <md-list-item class="menu-entry">
          <router-link :to="getUrlPath()" exact>
            <md-icon>home</md-icon>
            <span>{{$t('overview.title')}}</span>
            <router-link v-if="role === 'admin'" :to="getUrlPath({settings: true})" class="md-button md-icon-button md-list-action">
              <md-icon>settings</md-icon>
              <md-tooltip>{{$t('settings')}}</md-tooltip>
            </router-link>
          </router-link>
        </md-list-item>
        <md-list-item v-for="(resource, key) in resources" v-if="permissions[key].write || permissions['personal_' + key].write || permissions[key].read || permissions['personal_' + key].read">
          <router-link :to="getUrlPath({type: key})">
            <md-icon>{{resource.icon}}</md-icon>
            <span>{{$tc(key + '.title', 2)}}</span>
            <router-link v-if="permissions[key].write || permissions['personal_' + key].write" :to="getUrlPath({type: key, create: true})" class="md-button md-icon-button md-list-action">
              <md-icon>add</md-icon>
            </router-link>
          </router-link>
        </md-list-item>
      </md-list>
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
        <md-button :class="{'md-raised': true, 'md-primary': !auth.user || role}" @click.native="auth.login()">{{$t('auth.' + (auth.user ? 'switchAccount' : 'signIn'))}}</md-button>
        <md-button class="md-raised md-primary" v-if="auth.user && !role" @click.native="requestMembership">{{$t('auth.requestMembership')}}</md-button>
        <p v-else-if="auth.user && role">{{$t('auth.membership' + (role === '!' ? 'Denied' : 'Processed'))}}.</p>
      </div>
    </md-message>
  </div>
</template>

<script>
  import Firebase from 'firebase';
  import auth from '../auth';
  import AccountSwitcher from './AccountSwitcher';
  import Journal from './organization/Journal';
  import Organization from '../models/Organization';
  import Config from '../models/Config';
  import Permissions from '../models/Permissions';
  import Flashlight from '../models/Flashlight';
  import locales from '../locales';

  /* global document */
  const titleElement = document.querySelector('html > head > title');
  const defaultTitle = titleElement.innerHTML;

  export default {
    components: {
      AccountSwitcher,
      Journal
    },
    props: {
      domain: String
    },
    data() {
      return {
        organization: undefined,
        role: undefined,
        permissions: new Permissions(),
        resources: Config.resources,
        auth,
        title: undefined,
        key: undefined
      };
    },
    watch: {
      $route: {
        immediate: true,
        handler($route) {
          if ($route.params.organization_key) {
            this.key = $route.params.organization_key;
          }
        }
      },
      domain: {
        immediate: true,
        handler(domain) {
          if (domain) {
            Firebase.database().ref('domains/' + domain.replace(/\./g, ':')).once('value',
              (sn) => {
                this.key = sn.val();
              },
              () => {
                locales.setFromNavigator().then(() => {
                  this.organization = false;
                });
              }
            );
          }
        }
      },
      key: {
        immediate: true,
        handler: 'fetchOrganization'
      },
      'auth.user': 'fetchRoleAndPermissions',
      organization: 'fetchRoleAndPermissions'
    },
    methods: {
      fetchOrganization(organizationKey) {
        const key = organizationKey || this.organization && this.organization.key;
        if (!key || (this.organization && this.organization.key === key)) {
          return;
        }
        if (this.orgsRef) {
          this.orgsRef.off('value');
        }
        this.orgsRef = Firebase.database().ref('organizations/' + key);
        this.orgsRef.on('value',
          (snapshot) => {
            if (snapshot.val()) {
              const organization = new Organization(snapshot.key, snapshot.val());
              auth.user.bind(organization).once('value', (sn) => {
                const ul = sn.val() ? sn.val().lang : null;
                (ul ? locales.set(ul) : locales.setFromNavigator()).then(() => {
                  this.organization = organization;
                  if (this.organization.theme) {
                    this.$material.registerAndSetTheme(snapshot.key, this.organization.theme);
                  }
                  this.title = this.organization.title || (this.organization.name + ' ' + this.$t('thisPlatform'));
                  titleElement.innerText = this.title;
                });
              });
            } else {
              locales.setFromNavigator().then(() => {
                this.organization = null;
                this.title = null;
                titleElement.innerHTML = defaultTitle;
              });
            }
          },
          () => {
            locales.setFromNavigator().then(() => {
              this.organization = false;
              /* global window */
              window.setTimeout(() => {
                this.fetchOrganization(organizationKey);
              }, 1000);
            });
          }
        );
      },
      fetchRoleAndPermissions() {
        this.$nextTick(() => {
          const user = this.auth.user;
          const orgKey = this.key;
          this.permissions.bind(orgKey, user, () => {
            this.role = this.permissions.role;
            if ((this.role || this.organization) && user) {
              // Update user
              user.bind(orgKey).update({
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
              });
              if (this.role) {
                Firebase.database().ref('users/' + user.uid + '/organizations/' + orgKey)
                  .set(this.role !== '?' && this.role !== '!');
              }
            }
            if (this.organization && user) {
              // Update flashlight index paths
              Flashlight.updatePaths(orgKey, user.uid, this.permissions);
            }
          });
        });
      },
      requestMembership() {
        const user = this.auth.user;
        const orgKey = this.key;
        Firebase.database().ref('/security/organizations/' + orgKey + '/users/' + user.uid).set('?');
      },
      handleSearch(search) {
        const path = this.getUrlPath({ search: true });
        if (search === false) {
          this.$router.replace(this.previousRoute || '/' + this.getUrlPath());
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