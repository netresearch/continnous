<template>
  <md-autocomplete @selected="onUserSelected" :handler="search">
    <md-chips-input :md-static="disabled" :md-max="multiple ? Infinity : 1" ref="chipsInput" @change="onChipsChange" v-model="users" slot="input">
      <template scope="chip">
        {{chip.value.displayName}}
      </template>
    </md-chips-input>
    <template scope="item">
      {{item.value.displayName}}
    </template>
    <template slot="flyout" scope="autocomplete">
      <div class="user-input-no-results md-primary" @click.native="invite = true" v-if="autocomplete.currentResults && !autocomplete.currentResults.length">
        <md-icon>person_add</md-icon>
        <span>{{$t('actions.inviteUser')}}</span>
      </div>
    </template>
  </md-autocomplete>
</template>

<script>
  import Flashlight from '../../../models/Flashlight';
  import User from '../../../models/User';

  export default {
    props: {
      value: [String, Array],
      multiple: Boolean,
      disabled: Boolean,
      organization: Object,
      permissions: Object
    },
    data() {
      return {
        invite: undefined
      };
    },
    computed: {
      users() {
        if (!this.value || !this.organization) {
          return [];
        }
        const uids = typeof this.value === 'string' ? [this.value] : this.value;
        const users = [];
        uids.forEach((uid) => {
          users.push(new User(uid, this.organization));
        });
        return users;
      }
    },
    methods: {
      search(search) {
        return new Promise((resolve) => {
          if (!this.flashlight) {
            this.flashlight = new Flashlight(this.organization, this.permissions);
            this.flashlight.ignoreSubsequents();
          }
          this.flashlight.suggest(search, 'users').then((results) => {
            const users = [];
            if (results.length) {
              results[0].hits.forEach((hit) => {
                /* eslint-disable no-underscore-dangle */
                const user = new User(
                  Object.assign({ uid: hit._id }, hit._source), this.organization
                );
                users.push(user);
              });
            }
            resolve(users);
          });
        });
      },
      onUserSelected(user, event) {
        event.propagate = false;
        const uids = (typeof this.value === 'string' ? [this.value] : this.value || []).slice(0);
        uids.push(user.uid);
        this.$emit('change', uids);
        this.$emit('input', uids);
        this.$refs.chipsInput.currentChip = '';
      },
      onChipsChange(users) {
        if (typeof users === 'object') {
          const uids = users.map(user => user.uid);
          this.$emit('change', uids);
          this.$emit('input', uids);
        }
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .user-input-no-results {
    cursor: pointer;
    background: #fff;
    min-height: 48px;
    padding: 0 16px;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    &:hover {
      background-color: rgba(#999, .2);
    }
    span {
      flex: 1;
      margin-left: 16px;
    }
    .md-icon {
      color: rgba(#000, 0.56);
    }
  }
</style>