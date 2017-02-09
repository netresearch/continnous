<template>
  <div :class="['avatar', {'avatar-normal': !big}]">
    <template v-if="user">
      <md-avatar>
        <img :src="user.photoURL">
      </md-avatar>
      <div class="avatar-details" v-if="!noName">
        <slot :user="user">
          <span class="avatar-name">{{user.displayName}}</span>
        </slot>
      </div>
    </template>
  </div>
</template>

<script>
  import User from '../models/User';
  import auth from '../auth';

  export default {
    props: {
      uid: String,
      organization: Object,
      big: Boolean,
      noName: Boolean
    },
    data() {
      return {
        auth,
        user: undefined
      };
    },
    watch: {
      uid: {
        immediate: true,
        handler: 'setUserObject'
      },
      organization: 'setUserObject'
    },
    methods: {
      setUserObject() {
        this.$nextTick(() => {
          this.user = this.uid && this.organization
              ? new User(this.uid, this.organization) : undefined;
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
      margin-left: 8px;
      .avatar-name {
        font-size: 16px;
        font-weight: 500;
      }
    }
    .md-avatar {
      align-self: flex-start;
      margin: 6px 0;
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
  }
</style>