<template>
  <div>
    <md-autocomplete :provider="search" :filter="filter" @selected="onIssueSelected">
      <md-input-container slot="input">
        <label>{{$t('search')}}</label>
        <md-input v-model="sword" :placeholder="$t('search')"></md-input>
      </md-input-container>
      <template scope="item">
        <img :src="connection.options.self + item.value.img">
        <div style="flex: 1; margin-left: 6px;">
          <span v-html="item.value.keyHtml"></span> - <span v-html="item.value.summary"></span>
        </div>
      </template>
    </md-autocomplete>
    <login ref="login" :title="$t('auth.signInTo', { to: connection.options.title })"></login>
  </div>
</template>

<script>
  import Login from '../../components/Login';
  import Connector from './index';

  export default {
    components: { Login },
    props: {
      connection: Connector,
      current: Object,
    },
    data() {
      return {
        issues: undefined,
        sword: '',
        url: undefined
      };
    },
    mounted() {
      this.connection.signIn(this.$refs.login);
    },
    computed: {
      currentKeys() {
        const keys = [];
        if (this.current) {
          Object.keys(this.current).forEach((key) => {
            keys.push(this.current[key].key);
          });
        }
        return keys;
      }
    },
    methods: {
      filter(issue) {
        return this.currentKeys.indexOf(issue.key) < 0;
      },
      search(string) {
        const url = 'api/2/issue/picker?' +
          '&showSubTasks=true' +
          '&showSubTaskParent=true' +
          '&query=' + encodeURIComponent(string);

        return this.connection.get(url, { login: this.$refs.login }).then((data) => {
          const issues = [];
          if (data && data.sections) {
            data.sections.forEach((section) => {
              if (section.issues) {
                section.issues.forEach(issue => issues.push(issue));
              }
            });
          }
          const key = string.toUpperCase().trim();
          if (key.match(/^[A-Z]+-[0-9]+$/) && !issues.find(issue => issue.key === key)) {
            return this.connection.get('api/2/issue/' + key)
              .then((issue) => {
                issues.unshift({
                  key,
                  keyHtml: '<b>' + key + '</b>',
                  summary: issue.fields.summary,
                  summaryText: issue.fields.summary,
                  img: issue.fields.issuetype.iconUrl.replace(this.connection.options.self, '')
                });
                return issues;
              })
              .catch(() => Promise.resolve(issues));
          }
          // TODO: Implement jql search when to few results (text ~ search)
          return issues;
        });
      },
      onIssueSelected(issue, event) {
        event.propagate = false;
        this.$emit('selected', {
          key: issue.key,
          img: issue.img,
          summary: issue.summaryText,
        });
      }
    }
  };
</script>