<template>
  <div>
    <md-list>
      <md-list-item v-for="user in users">
        <md-avatar>
          <img :src="user.photoURL">
        </md-avatar>
        <span>{{user.displayName}}</span>
      </md-list-item>
    </md-list>
  </div>
</template>

<script>
  import Firebase from 'firebase';

  export default {
    firebase: {
      users: Firebase.database().ref('users')
    }
  };
</script>