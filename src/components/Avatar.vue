<template>
  <div :class="['avatar', {'avatar-normal': !big}]">
    <template v-if="userObject">
      <md-avatar>
        <img :src="userObject.photoURL">
      </md-avatar>
      <div class="avatar-details">
        <div class="avatar-user-name" v-if="!noName">{{userObject.uid === auth.user.uid && you ? you : userObject.displayName}}</div>
        <slot></slot>
      </div>
    </template>
  </div>
</template>

<script>
  import User from '../models/User';
  import auth from '../auth';

  export default {
    props: {
      user: Object,
      uid: String,
      organization: Object,
      big: Boolean,
      noName: Boolean,
      you: String
    },
    data() {
      return {
        auth
      };
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
  .avatar {
    position: relative;
    display: flex;
    flex-flow: row;
    justify-content: flex-start;
    align-items: center;
    min-width: 40px;
    min-height: 40px;
    padding-left: 40px;
    .md-avatar {
      position: absolute;
      left: 0;
      top: 0;
    }
    &.avatar-normal {
      min-width: 30px;
      min-height: 30px;
      padding-left: 30px;
      .md-avatar {
        width: 30px;
        min-width: 30px;
        height: 30px;
        min-height: 30px;
        border-radius: 100%;
      }
    }
    .avatar-details {
      flex: 1;
      display: flex;
      flex-flow: column;
      padding: 2px 0;
      > * {
        margin-left: 8px;
      }
      .avatar-user-name {
        font-size: 16px;
        font-weight: 500;
      }
    }
  }
</style>