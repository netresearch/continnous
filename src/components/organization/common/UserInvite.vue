<template>
  <md-dialog
      ref="dialog"
      class="user-invite"
      @close="inviting = false; $emit('close')"
      @focus.native="$refs.inputs[0].$el.focus()"
      :md-esc-to-close="!inviting"
      :md-click-outside-to-close="!inviting"
  >
    <md-dialog-title>
      {{$t('actions.inviteUser')}}</md-dialog-title>
    <md-dialog-content>
      <md-input-container v-for="field in fields">
        <label>{{$t('fields.' + field)}}</label>
        <md-input
            :disabled="inviting"
            ref="inputs"
            :value="values[field]"
            @change="values[field] = $event.trim(); validate(); if (field == 'email') { error = undefined }"></md-input>
      </md-input-container>
      <p class="error" v-if="error">{{$t('invite.' + error)}}</p>
      <md-progress md-indeterminate v-if="inviting"></md-progress>
    </md-dialog-content>
    <md-dialog-actions>
      <md-button @click.native="$refs.dialog.close()" :disabled="inviting">{{$t('actions.cancel')}}</md-button>
      <div style="flex: 1; min-width: 24px;"></div>
      <md-button class="md-primary" :disabled="!valid || inviting || error" @click.native="invite()">{{$t('actions.inviteUser')}}</md-button>
    </md-dialog-actions>
  </md-dialog>
</template>

<script>
  import Firebase from '../../../firebase';
  import auth from '../../../auth';

  const validEmailRegex = new RegExp(
    '^(([^<>()[\\].,;:\\s@"]+(\\.[^<>()[\\].,;:\\s@"]+)*)|(".+"))'
    + '@(([^<>()[\\].,;:\\s@"]+\\.)+[^<>()[\\].,;:\\s@"]{2,})$',
    'i'
  );

  export default {
    props: {
      defaults: {
        type: Object,
        default() {
          return {};
        }
      },
      organization: Object,
    },
    data() {
      const fields = ['displayName', 'email'];
      return {
        fields,
        values: {},
        valid: false,
        error: undefined,
        inviting: false
      };
    },
    watch: {
      defaults: {
        immediate: true,
        handler(defaults) {
          this.inviting = false;
          const values = {};
          this.fields.forEach((field) => {
            let value = defaults[field] || '';
            if (field === 'displayName' && value) {
              value = value.trim().split(' ').map(v => v.substr(0, 1).toUpperCase() + v.substr(1)).join(' ');
            }
            values[field] = value;
          });
          this.values = values;
          this.validate();
        }
      },
    },
    methods: {
      open() {
        this.$refs.dialog.open();
      },
      validate() {
        this.valid = this.values.displayName.length > 1 && this.values.email.match(validEmailRegex);
      },
      invite() {
        this.error = undefined;
        this.inviting = true;
        let firstHit = true;
        const ref = Firebase.database().ref('/users/organizations/' + this.organization.key)
          .orderByChild('email')
          .equalTo(this.values.email);
        ref.on('value', (sn) => {
          let user;
          sn.forEach((csn) => {
            user = Object.assign({ uid: csn.key }, csn.val());
            return true;
          });
          this.error = firstHit && user ? 'userExists' : undefined;
          firstHit = false;
          if (this.error) {
            this.inviting = false;
            ref.off('value');
          } else if (!user) {
            Firebase.database().ref('/users/organizations/' + this.organization.key).push({
              displayName: this.values.displayName,
              email: this.values.email,
              inviteBy: auth.user.uid,
              inviteState: 0
            });
          } else if (user.inviteState !== 0) {
            if (typeof user.inviteState === 'string') {
              this.inviting = false;
              this.error = user.invite.state;
            } else if (this.inviting) {
              this.$emit('invited', user);
              this.$refs.dialog.close();
              this.inviting = false;
              this.error = undefined;
            }
            ref.off('value');
          }
        });
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .user-invite {
    .md-progress {
      position: relative;
      top: 16px;
      margin-top: -4px;
    }
  }
</style>