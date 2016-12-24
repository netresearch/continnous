<script>
  import User from '../models/User';

  const firebase = require('firebase');

  export default {
    name: 'auth',
    props: ['value'],
    data() {
      return {
        ready: false,
      };
    },
    created() {
      // Using a redirect.
      firebase.auth().onAuthStateChanged((user) => {
        this.ready = true;
        this.setUser(user);
      });
      firebase.auth().getRedirectResult().then((result) => {
        this.setUser(result.user);
      });
    },
    methods: {
      setUser(user) {
        console.log(user);
        this.$emit('input', user ? User.createFromAuth(user) : null);
      },
      login() {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        firebase.auth().signInWithRedirect(provider);
      },
      logout() {
        firebase.auth().signOut().then(() => {
          this.setUser(null);
        });
      },
    },
  };
</script>

<template>
  <div class="auth">
    <template v-if="ready">
      <md-button @click="login" v-if="!value">Login</md-button>
      <md-menu md-direction="bottom left" md-size="6" v-else>
        <md-avatar-button md-menu-trigger><img :src="value.photoURL"></md-avatar-button>
        <md-menu-content>
          <div class="account-card">
            <md-avatar class="md-large">
              <img :src="value.photoURL">
            </md-avatar>
            <div class="account-card-info">
              <div>{{value.email}}</div>
              <div class="author-card-links">
                <md-link-button @click="logout">Logout</md-link-button>
              </div>
            </div>
          </div>
        </md-menu-content>
      </md-menu>
    </template>
    <md-spinner v-else class="md-contrast" md-indeterminate md-size="40"></md-spinner>
  </div>
</template>

<style lang="scss"  rel="stylesheet/scss">
  .auth {
    position: relative;
    min-height: 52px;
    min-width: 56px;
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
    .md-spinner {
      position: absolute;
      left: 50%;
      top: 50%;
      margin-top: -20px;
      margin-left: -20px;
    }
  }
</style>