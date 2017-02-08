<template>
  <div :class="['avatar', {'avatar-normal': !big}]">
    <template v-if="userObject">
      <md-avatar>
        <img :src="userObject.photoURL">
      </md-avatar>
      <div class="avatar-details">
        <div class="avatar-name-container" v-if="!noName">
          <span class="avatar-name">{{userObject.uid === auth.user.uid && you ? you : userObject.displayName}}</span>
          <span v-if="caption" v-html="caption" class="md-caption"></span>
        </div>
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
      you: String,
      caption: String
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
    .avatar-details {
      flex: 1;
      display: flex;
      flex-flow: column;
      padding: 2px 0;
      > * {
        margin-left: 8px;
      }
      .avatar-name-container {
        display: flex;
        flex-flow: row;
        .avatar-name {
          flex: 1 0 auto;
          font-size: 16px;
          font-weight: 500;
        }
      }
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
      .avatar-details {
        .avatar-name-container {
          .avatar-name {
            font-size: 14px;
            line-height: 14px;
          }
          .md-caption {
            line-height: 14px;
          }
        }
      }
    }
  }
</style>