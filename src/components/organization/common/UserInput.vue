<template>
  <md-autocomplete ref="autocomplete" @selected="onUserSelected" :provider="searchUsers" :filter="filter">
    <template scope="item">
      <avatar :user="item.value"></avatar>
    </template>
    <template slot="input" scope="autocomplete">
      <md-chips-input
          class="user-input-chips"
          :md-static="disabled"
          :md-max="multiple ? Infinity : 1"
          ref="chipsInput"
          @change="onChipsChange"
          v-model="users">
        <template scope="chip">
          <avatar :user="chip.value" mini></avatar>
        </template>
      </md-chips-input>
      <user-invite
          ref="invite"
          v-if="invite !== undefined"
          @invited="onUserSelected($event); $refs.autocomplete.clearCache()"
          :organization="organization"
          :defaults="{ displayName: autocomplete.q }"
          @close="invite = false"
      ></user-invite>
    </template>
    <template slot="flyout" scope="autocomplete">
      <div @click="invite = true" class="md-autocomplete-flyout-item md-primary" v-if="autocomplete.currentResults && !autocomplete.currentResults.length">
        <md-icon>person_add</md-icon>
        <span>{{$t('actions.inviteUser')}}</span>
      </div>
    </template>
  </md-autocomplete>
</template>

<script>
  import User from '../../../models/User';
  import Avatar from '../../Avatar';
  import UserInvite from './UserInvite';
  import auth from '../../../auth';
  import searchMixin from './mixins/search';

  export default {
    components: { Avatar, UserInvite },
    mixins: [searchMixin],
    props: {
      value: [String, Array],
      multiple: Boolean,
      disabled: Boolean,
    },
    data() {
      return {
        invite: undefined
      };
    },
    watch: {
      invite(invite) {
        if (invite) {
          this.$nextTick(() => {
            this.$nextTick(() => {
              this.$refs.invite.open();
            });
          });
        }
      }
    },
    computed: {
      users() {
        const users = [];
        if (this.value && this.organization) {
          const uids = typeof this.value === 'string' ? [this.value] : this.value;
          uids.forEach((uid) => {
            users.push(new User(uid, this.organization));
          });
        }
        this.$nextTick(() => {
          if (this.$refs.autocomplete) {
            this.$refs.autocomplete.updateCurrentResults();
          }
        });
        return users;
      }
    },
    methods: {
      filter(user) {
        if (user.uid === auth.user.uid) {
          return false;
        }
        return !this.users.find(u => u.uid === user.uid);
      },
      onUserSelected(user, event) {
        if (event) {
          event.propagate = false;
        }
        const uids = (typeof this.value === 'string' ? [this.value] : this.value || []).slice(0);
        uids.push(user.uid);
        this.$emit('change', uids);
        this.$emit('input', uids);
        this.$refs.chipsInput.currentChip = '';
      },
      onChipsChange(users) {
        if (typeof users === 'object') {
          const uids = users.length ? users.map(user => user.uid) : null;
          this.$emit('change', uids);
          this.$emit('input', uids);
        }
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .user-input-chips {
    .md-chip {
      padding-top: 0;
      padding-left: 0;
      padding-bottom: 0;
    }
    .avatar {
      display: inline-flex;
      .md-avatar {
        margin: 0;
      }
      .avatar-details {
        margin-top: 1px;
        margin-bottom: 1px;
      }
    }
  }
</style>