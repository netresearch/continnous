<template>
  <div>
    <form-element
        type="md-input"
        name="url"
        label="URL"
        placeholder="https://jira-instance.example.com"
        validate="required,url"
    >
    </form-element>
    <md-dialog
        ref="login"
        :md-click-outside-to-close="false"
        :md-esc-to-close="false"
      >
      <md-dialog-title v-if="connection">Login to {{connection.options.title}}</md-dialog-title>
      <md-dialog-content>
        <div class="md-error" v-if="signInError">
          Your credentials are wrong
        </div>
        <md-input-container>
          <label>Username</label>
          <md-input v-model="username" required></md-input>
        </md-input-container>
        <md-input-container>
          <label>Password</label>
          <md-input type="password" v-model="password" required></md-input>
        </md-input-container>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button @click.native="$refs.login.close(); $emit('login-cancel')">{{$t('actions.cancel')}}</md-button>
        <div style="flex: 1"></div>
        <md-button
            class="md-primary"
            :disabled="!username.trim() || !password.trim()"
            @click.native="$emit('login-submit', username, password)">
          {{$t('auth.signIn')}}</md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        connection: undefined,
        username: '',
        password: '',
        signInError: false
      };
    },
    methods: {
      test(connection) {
        return connection.signIn(signInError => new Promise((resolve, reject) => {
          this.signInError = signInError;
          this.$refs.login.open();
          this.$once('login-cancel', reject);
          this.$once('login-submit', (username, password) => {
            resolve({ username, password });
          });
        }));
      }
    }
  };
</script>