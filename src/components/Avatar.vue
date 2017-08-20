<template>
  <div :class="['avatar', {'avatar-normal': !big && !mini, 'avatar-mini': mini}]">
    <template v-if="userObject">
      <md-avatar :class="imgNotFound ? 'md-avatar-icon' : ''">
        <img v-if="userObject.photoURL && !imgNotFound" :src="userObject.photoURL" @error.native="imgNotFound = true">
        <md-icon v-else>person</md-icon>
      </md-avatar>
      <div class="avatar-details" v-if="!noName">
        <slot :user="userObject">
          <span class="avatar-name">{{userObject.displayName}}</span>
        </slot>
      </div>
    </template>
  </div>
</template>

<script>
  import User from '../models/User';
  import Current from '../models/Current';

  export default {
    props: {
      uid: String,
      user: Object,
      big: Boolean,
      mini: Boolean,
      noName: Boolean
    },
    data() {
      return {
        Current,
        userObject: undefined,
        imgNotFound: false
      };
    },
    watch: {
      uid: {
        immediate: true,
        handler: 'setUserObject'
      },
      'Current.user': 'setUserObject',
      user: 'setUserObject'
    },
    methods: {
      setUserObject() {
        this.$nextTick(() => {
          if (this.user) {
            this.userObject = this.user;
            return;
          }
          const uid = this.uid === 'current' ? Current.user.uid : this.uid;
          this.userObject = uid && Current.organization
              ? new User(uid, Current.organization) : undefined;
        });
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
    .avatar-details {
      flex: 1;
      display: flex;
      flex-flow: column;
      padding: 2px 0;
      margin: 2px 0;
      margin-left: 10px;
      .avatar-name {
        font-size: 16px;
        font-weight: 500;
      }
    }
    .md-avatar {
      align-self: flex-start;
      margin: 6px 0;
      background: rgba(#000, 0.12);
      .md-icon {
        color: rgba(#000, 0.56);
      }
    }
    &.avatar-normal {
      .md-avatar {
        width: 30px;
        min-width: 30px;
        height: 30px;
        min-height: 30px;
        border-radius: 100%;
        margin: 4px 0;
      }
      .avatar-details {
        padding: 0;
        * {
          line-height: 18px;
        }
        .avatar-name {
          font-size: 14px;
          font-weight: 400;
        }
      }
    }
    &.avatar-mini {
      .md-avatar {
        $width: 18px;
        width: $width;
        min-width: $width;
        height: $width;
        min-height: $width;
        border-radius: 100%;
        margin: 4px 0;
        .md-icon {
          $width: $width + 4px;
          width: $width;
          min-width: $width;
          height: $width;
          min-height: $width;
          font-size: $width;
          position: relative;
          margin: 0;
          position: relative;
          top: calc(50% + 1px);
        }
      }
      .avatar-details {
        padding: 0;
        margin-left: 6px;
        * {
          line-height: 18px;
        }
        .avatar-name {
          font-size: 14px;
          font-weight: 400;
        }
      }
    }
  }
</style>