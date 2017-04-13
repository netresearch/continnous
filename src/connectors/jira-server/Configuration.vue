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
        this.title = connection.options.title;
        return connection.signIn(this.$refs.login);
      }
    }
  };
</script>