<template>
  <div id="organization">
    <md-app :toolbar-class="{'md-transparent': !organization}">
      <template slot="toolbar">
        <h2 class="md-title" style="flex: 1">{{organization ? organization.name : ''}}</h2>
        <account-switcher></account-switcher>
      </template>

      <div>
        Orga: {{$route.params.organization_key}}
      </div>

      <md-list slot="sidebar">
        <md-list-item>
          <md-icon>home</md-icon>
          <span>{{$t('overview')}}</span>
          <md-button v-if="isAdmin" class="md-icon-button md-list-action">
            <md-icon>settings</md-icon>
          </md-button>
        </md-list-item>
      </md-list>
    </md-app>

    <md-message
        v-if="!organization"
        :loading="organization === undefined || !auth.ready"
        :warning="organization === false"
        :error="organization === null"
        splash>
      <div v-if="organization === null">
        {{$t('errors.404')}}
      </div>
      <div v-else-if="organization === false">
        <div>
          {{$t('errors.' + (auth.user ? 403 : 401))}}
        </div>
        <md-button class="md-raised md-primary" @click="auth.login()">{{$t('auth.' + (auth.user ? 'switchAccount' : 'signIn'))}}</md-button>
      </div>
    </md-message>
  </div>
</template>

<script>
  import Firebase from 'firebase';
  import auth from '../auth';
  import AccountSwitcher from './AccountSwitcher';

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
        isAdmin: false,
        auth
      };
    },
    watch: {
      $route: 'fetchOrganization',
      'auth.user': 'fetchOrganizationAdmin'
    },
    methods: {
      fetchOrganization() {
        if (this.orgsRef) {
          this.orgsRef.off('value');
        }
        this.orgsRef = Firebase.database().ref('organizations/' + this.$route.params.organization_key);
        this.orgsRef.on('value',
          (snapshot) => {
            this.organization = snapshot.val();
            if (this.organization) {
              this.$material.registerAndSetTheme(snapshot.key, this.organization.theme);
            }
          },
          () => {
            this.organization = false;
          }
        );

        this.fetchOrganizationAdmin();
      },
      fetchOrganizationAdmin() {
        if (this.orgAdminsRef) {
          this.orgAdminsRef.off('value');
        }
        this.isAdmin = false;
        if (this.auth.user) {
          this.orgAdminsRef = Firebase.database().ref(
            'organization_admins/' + this.$route.params.organization_key + '/' + this.auth.user.uid
          );
          this.orgAdminsRef.on('value', (snapshot) => {
            this.isAdmin = snapshot.val();
          });
        }
      }
    }
  };
</script>