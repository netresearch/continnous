<template>
  <div class="jira-links">
    <md-list>
      <md-list-item v-for="(issue, key) in links">
        <span><img :src="connection.options.self + issue.img"/></span>
        <div>
          <a :href="connection.options.self + '/browse/' + issue.key" target="_blank">
            {{issue.key}} - {{issue.summary}}
          </a>
        </div>
        <md-button v-if="clearable && !deleting" @click.native="removeLink(issue, key)" class="md-icon-button"><md-icon>clear</md-icon></md-button>
        <md-spinner v-if="deleting === key" :md-size="20" style="min-width: 20px; max-width: 20px;" md-indeterminate></md-spinner>
      </md-list-item>
    </md-list>
    <login ref="login" :title="$t('auth.signInTo', { to: connection.options.title })"></login>
    <md-dialog-alert ref="error" :md-title="$t('errors.general')" :md-content="$t('links.errorClear')"></md-dialog-alert>
  </div>
</template>

<script>
  import Login from '../../components/Login';
  import Connector from './index';

  export default {
    components: { Login },
    props: {
      connection: Connector,
      links: Object,
      item: Object,
      type: String,
      clearable: Boolean
    },
    data() {
      return {
        deleting: undefined
      };
    },
    methods: {
      removeLink(issue, key) {
        const path = 'api/2/issue/' + issue.key + '/remotelink?globalId=' + this.item.id;
        this.deleting = key;
        this.connection
          .signIn(this.$refs.login)
          .then(() => this.connection.delete(path))
          .then(
            () => {
              this.$emit('clear', key);
            },
            (error) => {
              if (error.response.statusCode === 404) {
                this.$emit('clear', key);
              } else {
                this.$refs.error.open();
              }
            }
          )
          .then(() => { this.deleting = undefined; });
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .jira-links {
    .md-list-item-container {
      span {
        display: block;
        width: 24px;
        margin-right: 16px;
        text-align: center;
        line-height: 1px;
      }
      div {
        flex: 1;
        a {
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
</style>