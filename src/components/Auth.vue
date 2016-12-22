<template>
  <div class="auth">
    <template v-if="ready">
      <md-button @click="login" v-if="!value">Login</md-button>
      <md-button @click="logout" v-else>Logout</md-button>
    </template>
  </div>
</template>

<script>
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
        let userModel;
        if (user) {
          userModel = {
            email: user.email,
            displayName: user.displayName,
            uid: user.uid,
            organizations: []
          };
          const domain = user.email.split('@').pop();
          const orgsRef = firebase.database().ref('organizations').orderByChild('domain').equalTo(domain);
          orgsRef.on('child_added', (snapshot) => {
            const org = snapshot.val();
            userModel.organizations.push({
              name: org.name,
              uid: snapshot.key
            });
          });
          orgsRef.on('child_removed', (snapshot) => {
            userModel.organizations = userModel.organizations.filter(
              org => (org.uid !== snapshot.key)
            );
          });
          orgsRef.on('child_changed', (snapshot) => {
            userModel.organizations.forEach((org) => {
              const my = org;
              if (my.uid === snapshot.key) {
                my.name = snapshot.val().name;
              }
            });
          });
        }
        this.$emit('input', userModel);
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
