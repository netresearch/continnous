<template>
  <div>
    <md-dialog
        ref="login"
        :md-click-outside-to-close="false"
        :md-esc-to-close="false"
    >
      <md-dialog-title v-if="title">{{title}}</md-dialog-title>
      <md-dialog-content>
        <p class="error" v-if="inv">{{$t('auth.invalid', { usernameLabel: $t('auth.' + usernameLabel) })}}</p>
        <p class="error" v-if="err">
          {{typeof err === 'string' ? err : (typeof err === 'object' ? err.message : $t('auth.error'))}}
        </p>
        <md-input-container>
          <label>{{$t('auth.' + usernameLabel)}}</label>
          <md-input
              v-model="username"
              @change="inv = undefined"
              :disabled="processing || err"
              required></md-input>
        </md-input-container>
        <md-input-container>
          <label>{{$t('auth.password')}}</label>
          <md-input
              type="password"
              v-model="password"
              @change="inv = undefined"
              :disabled="processing || err"
              required></md-input>
        </md-input-container>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button
            @click.native="cancel"
            :disabled="processing"
        >{{$t('actions.cancel')}}</md-button>
        <div style="flex: 1"></div>
        <md-button
            class="md-primary"
            :disabled="processing || err || !username.trim() || !password.trim()"
            @click.native="submit"
        >{{$t('auth.signIn')}}</md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
  export default {
    props: {
      title: String,
      usernameLabel: {
        type: String,
        default: 'username'
      }
    },
    data() {
      return {
        err: undefined,
        inv: undefined,
        processing: false,
        username: '',
        password: ''
      };
    },
    methods: {
      login(invalid) {
        this.inv = invalid;
        this.processing = false;
        this.$refs.login.open();
        return new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
        });
      },
      cancel() {
        this.resolve = undefined;
        if (this.reject) {
          this.reject();
          this.reject = undefined;
        }
      },
      close() {
        this.$refs.login.close();
      },
      submit() {
        this.processing = true;
        this.reject = undefined;
        if (this.resolve) {
          this.resolve({ username: this.username, password: this.password });
          this.resolve = undefined;
        }
      },
      ok() {
        this.processing = false;
        this.$refs.login.close();
      },
      invalid() {
        return this.login(true);
      },
      error(error) {
        this.err = error;
        this.processing = false;
      }
    }
  };
</script>