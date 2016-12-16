<template>
  <div class="auth">
    <template v-if="ready">
      <md-button @click="login" v-if="!user">Login</md-button>
      <md-button @click="logout" v-else>Logout</md-button>
    </template>
  </div>
</template>

<script>
  const firebase = require('firebase');

  export default {
    name: 'auth',
    data() {
      return {
        ready: false,
        user: undefined,
      };
    },
    created() {
      // Using a redirect.
      firebase.auth().onAuthStateChanged((user) => {
        this.ready = true;
        this.user = user;
      });
      firebase.auth().getRedirectResult().then((result) => {
        this.user = result.user;
      });
    },
    methods: {
      login() {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        firebase.auth().signInWithRedirect(provider);
      },
      logout() {
        firebase.auth().signOut().then(() => {
          this.user = undefined;
        });
      },
    },
  };
</script>
