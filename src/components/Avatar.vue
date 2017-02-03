<template>
  <div class="avatar">
    <template v-if="userObject">
      <md-avatar>
        <img :src="userObject.photoURL">
      </md-avatar>
      <span>{{userObject.displayName}}</span>
    </template>
  </div>
</template>

<script>
  import User from '../models/User';

  export default {
    props: {
      user: Object,
      uid: String,
      organization: Object
    },
    computed: {
      userObject() {
        if (this.user) {
          return this.user instanceof User ? this.user : new User(this.user);
        }
        return this.uid && this.organization ? new User(this.uid, this.organization) : undefined;
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">

</style>