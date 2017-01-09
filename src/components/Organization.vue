<template>
  <div id="organization">
    <md-app :toolbar-class="{'md-transparent': !organization}">
      <template slot="toolbar">
        <h2 class="md-title" style="flex: 1">{{organization ? organization.name : ''}}</h2>
        <account-switcher></account-switcher>
      </template>

      <template v-if="organization">
        <div class="app-content">
          <router-view :organization="organization"></router-view>
        </div>

        <md-list slot="sidebar">
          <md-list-item class="menu-entry">
            <router-link :to="'/' + organization.key" exact>
              <md-icon>home</md-icon>
              <span>{{$t('overview')}}</span>
              <router-link v-if="membership === 'admin'" :to="'/' + organization.key + '/settings'" class="md-button md-icon-button md-list-action">
                <md-icon>settings</md-icon>
                <md-tooltip>{{$t('settings')}}</md-tooltip>
              </router-link>
            </router-link>
          </md-list-item>
          <md-list-item>
            <router-link :to="'/' + organization.key + '/objectives'">
              <md-icon>rowing</md-icon>
              <span>{{$tc('objective', 2)}}</span>
            </router-link>
          </md-list-item>
          <md-list-item>
            <router-link :to="'/' + organization.key + '/ideas'">
              <md-icon>lightbulb_outline</md-icon>
              <span>{{$tc('idea', 2)}}</span>
            </router-link>
          </md-list-item>
        </md-list>
      </template>
    </md-app>

    <md-message
        v-if="!organization"
        :status="organization === undefined || !auth.ready ? 0 : (organization === false ? -2 : (organizaion === null ? -1 : 1))"
        :timeout="0"
        splash>
      <div v-if="organization === null">
        {{$t('errors.404')}}
      </div>
      <div v-else-if="organization === false">
        <div>
          {{$t('errors.' + (auth.user ? 403 : 401))}}
        </div>
        <md-button :class="{'md-raised': true, 'md-primary': !auth.user || membership}" @click="auth.login()">{{$t('auth.' + (auth.user ? 'switchAccount' : 'signIn'))}}</md-button>
        <md-button class="md-raised md-primary" v-if="auth.user && !membership" @click="requestMembership">$t('auth.requestMembership')</md-button>
        <p v-else-if="auth.user && membership">{{$t('auth.membership' + (membership === '!' ? 'Denied' : 'Processed'))}}.</p>
      </div>
    </md-message>
  </div>
</template>

<script>
  import Firebase from 'firebase';
  import auth from '../auth';
  import AccountSwitcher from './AccountSwitcher';
  import Organization from '../models/Organization';

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
        membership: undefined,
        auth
      };
    },
    watch: {
      $route: 'fetchOrganization',
      'auth.user': 'fetchOrganizationMembership',
      organization: 'fetchOrganizationMembership'
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
            } else {
              this.organization = null;
            }
          },
          () => {
            this.organization = false;
            this.fetchOrganization();
          }
        );
      },
      fetchOrganizationMembership() {
        const user = this.auth.user;
        const orgKey = this.$route.params.organization_key;
        if (this.orgUsersRef) {
          this.orgUsersRef.off('value');
        }
        this.membership = undefined;
        if (user) {
          this.orgUsersRef = Firebase.database().ref(
            '/security/organizations/' + orgKey + '/users/' + user.uid
          );
          this.orgUsersRef.on('value', (snapshot) => {
            this.membership = snapshot.val();
            if (this.membership || this.organization) {
              Firebase.database().ref('/organizations/' + orgKey + '/users/' + user.uid).update({
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
              });
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