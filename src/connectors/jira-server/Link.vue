<template>
  <div>
    <md-input-container>
      <label>{{$t('search')}}</label>
      <md-input v-model="sword" @input="search" :placeholder="$t('search')"></md-input>
    </md-input-container>
    <login ref="login" :title="$t('auth.signInTo', { to: connection.options.title })"></login>
    <template v-if="sword && issues">
      <md-list v-if="issues.length">
        <md-list-item v-for="issue in issues" @click.native="onIssueSelected(issue)">
          <img :src="url + issue.img">
          <div style="flex: 1; margin-left: 6px;">
            <span v-html="issue.keyHtml"></span> - <span v-html="issue.summary"></span>
          </div>
        </md-list-item>
      </md-list>
      <p class="md-caption" v-else>{{$t('noMatches')}}</p>
    </template>
  </div>
</template>

<script>
  import Login from '../../components/Login';
  import Connector from './index';

  export default {
    components: { Login },
    props: {
      connection: Connector,
    },
    mounted() {
      this.connection.signIn(this.$refs.login).then((user) => {
        this.url = user.self.split('/rest/api/')[0];
      });
    },
    data() {
      return {
        issues: undefined,
        sword: '',
        url: undefined
      };
    },
    methods: {
      search(string) {
        this.connection.get(
          'api/2/issue/picker?query=' + encodeURIComponent(string),
          { login: this.$refs.login }
        ).then((data) => {
          const issues = [];
          if (data && data.sections) {
            data.sections.forEach((section) => {
              if (section.issues) {
                section.issues.forEach(issue => issues.push(issue));
              }
            });
          }
          this.issues = issues;
        });
      },
      onIssueSelected(issue) {
        this.$emit('selected', {
          key: issue.key,
          img: issue.img,
          summary: issue.summaryText,
        });
      }
    }
  };
</script>