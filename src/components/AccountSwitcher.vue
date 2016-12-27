<script>
  import auth from '../auth';

  export default {
    data() {
      return {
        auth
      };
    }
  };
</script>

<template>
  <div class="auth">
    <template v-if="auth.ready">
      <md-button @click="auth.login()" v-if="!auth.user">Login</md-button>
      <md-menu md-direction="bottom left" md-size="6" v-else>
        <md-avatar-button md-menu-trigger><img :src="auth.user.photoURL"></md-avatar-button>
        <md-menu-content>
          <div class="account-card">
            <md-avatar class="md-large">
              <img :src="auth.user.photoURL">
            </md-avatar>
            <div class="account-card-info">
              <div>{{auth.user.email}}</div>
              <div class="author-card-links">
                <md-button class="md-primary md-link" @click="auth.logout()">Logout</md-button>
              </div>
            </div>
          </div>
        </md-menu-content>
      </md-menu>
    </template>
    <md-spinner v-else class="md-contrast" md-indeterminate :md-size="40"></md-spinner>
  </div>
</template>

<style lang="scss" rel="stylesheet/scss">
  .auth {
    position: relative;
    min-height: 52px;
    min-width: 56px;
    .md-spinner {
      position: absolute;
      left: 50%;
      top: 50%;
      margin-top: -20px;
      margin-left: -20px;
    }
  }
  .account-card {
    padding: 8px 16px;
    display: flex;
    align-items: center;
    .md-avatar {
      position: static;
    }
    .account-card-info {
      display: flex;
      flex-flow: column;
      flex: 1;
      margin-left: 16px;
    }
  }
</style>