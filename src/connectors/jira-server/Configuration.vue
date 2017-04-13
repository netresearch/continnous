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
    <login ref="login" :title="$t('auth.signInTo', { to: title })"></login>
  </div>
</template>

<script>
  import Login from '../../components/Login';

  export default {
    components: { Login },
    data() {
      return {
        title: undefined,
      };
    },
    methods: {
      test(connection) {
        const login = this.$refs.login;
        this.title = connection.options.title;
        return connection
          .signIn(login.login)
          .then(() => login.ok(), (e) => {
            login.close();
            return Promise.reject(e);
          });
      }
    }
  };
</script>