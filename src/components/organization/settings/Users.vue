<template>
  <div>
    <md-list>
      <md-list-item v-for="(user, uid) in users" :disabled="uid === auth.user.uid">
        <md-avatar>
          <img :src="user.photoURL">
        </md-avatar>
        <span class="userListName">
          {{user.displayName}}
          <br>
          <span class="md-caption">{{user.email}}</span>
        </span>
        <span class="md-caption">{{userRoles[uid] || ''}}</span>
      </md-list-item>
    </md-list>
  </div>
</template>

<script>
  import Firebase from 'firebase';
  import auth from '../../../auth';

  export default {
    props: ['organization'],
    data() {
      return {
        users: undefined,
        userRoles: {},
        auth
      };
    },
    created() {
      Firebase.database().ref('security/organizations/' + this.organization.key + '/users').on('value', (snapshot) => {
        this.userRoles = snapshot.val();
      });
      Firebase.database().ref('organizations/' + this.organization.key + '/users').on('value', (snapshot) => {
        this.users = snapshot.val();
      });
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .userListName {
    line-height: normal;
  }
</style>