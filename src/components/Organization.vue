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
        <md-list-item>Huhu</md-list-item>
      </md-list>
    </md-app>
    <!--<md-toolbar :class="{'md-transparent': !organization}">
      <h2 class="md-title" style="flex: 1">{{organization ? organization.name : ''}}</h2>
      <account-switcher></account-switcher>
    </md-toolbar>-->
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
        auth
      };
    },
    watch: {
      // call again the method if the route changes
      $route: 'fetchOrganization'
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
      }
    }
  };
</script>