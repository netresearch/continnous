<template>
  <div>
    <div v-if="signingIn || adding" style="text-align: center; padding-top: 16px; height: 48px; margin: 0 auto 24px;">
      <md-spinner :md-size="32" md-indeterminate></md-spinner>
    </div>
    <md-autocomplete v-else :provider="search" :filter="filter" @selected="onIssueSelected">
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
    <md-dialog-alert ref="error" :md-title="$t('errors.general')" :md-content="$t('links.errorAdd')"></md-dialog-alert>
  </div>
</template>

<script>
  import Login from '../../components/Login';
  import Connector from './index';
  import Config from '../../models/Config';

  export default {
    components: { Login },
    props: {
      connection: Connector,
      current: Object,
      organization: Object,
      item: Object,
      type: String,
      archive: Boolean
    },
    data() {
      return {
        issues: undefined,
        sword: '',
        url: undefined,
        signingIn: true,
        adding: false
      };
    },
    mounted() {
      this.connection.signIn(this.$refs.login).then(() => { this.signingIn = false; });
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
        this.adding = true;
        event.propagate = false;
        const icnUrlPre = 'https://raw.githubusercontent.com/google/material-design-icons/master/action/1x_web/ic_';
        const icnUrlPost = '_black_18dp.png';
        (this.archive ? this.organization.journal.getArchiveInfo(this.item) : Promise.resolve())
          .then(archiveInfo => this.connection.post(
            'api/2/issue/' + issue.key + '/remotelink',
            {
              globalId: this.item.id,
              object: {
                url: this.getAbsoluteUrl(this.item.id),
                title: this.item.title,
                icon: {
                  url16x16: icnUrlPre + Config.resources[this.item.resource].icon + icnUrlPost,
                  title: this.$tc(this.type + '.title', 1)
                },
                status: !archiveInfo ? undefined : {
                  resolved: true,
                  icon: {
                    url16x16: icnUrlPre + archiveInfo.icon + icnUrlPost,
                    title: this.$t('transition.' + archiveInfo.occasion)
                  }
                }
              }
            }
          ))
          .then(
            () => {
              this.$emit('add', {
                key: issue.key,
                img: issue.img,
                summary: issue.summaryText,
              });
            },
            () => {
              this.$refs.error.open();
            }
          )
          .then(() => { this.adding = false; });
      }
    }
  };
</script>