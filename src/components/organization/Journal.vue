<template>
  <div class="journal">
    <md-layout md-gutter md-row  v-for="entry in finalEntries">

      <avatar :organization="organization" :uid="entry.uid" :you="$t('you')" :caption="formatTime(entry.time)">
        <span class="md-caption"> {{
          $t('journal.' + (entry.uid === auth.user.uid ? 'you' : 'user'), {
            action: $t('journal.' + entry.action),
            fields: getJoinedFields(entry.fields)
          })}}
        </span>
        <div v-if="!noResource" class="journal-resource">
          <md-icon class="md-small">{{resources[entry.resource].icon}}</md-icon>
          {{entry.title}}
        </div>
      </avatar>
    </md-layout>
  </div>
</template>

<script>
  import moment from 'moment';
  import Config from '../../models/Config';
  import auth from '../../auth';
  import Avatar from '../Avatar';

  export default {
    components: { Avatar },
    props: {
      organization: Object,
      entries: [Array, Object],
      noResource: Boolean
    },
    data() {
      return {
        resources: Config.resources,
        auth
      };
    },
    computed: {
      finalEntries() {
        if (this.entries) {
          return this.entries;
        }
        return this.organization ? this.organization.journal.entries : [];
      }
    },
    methods: {
      formatTime(time) {
        return moment(time).calendar();
      },
      getJoinedFields(fields) {
        if (!fields || !fields.length) {
          return '';
        }
        const translate = (field) => {
          if (this.$te('fields.' + field + '.label')) {
            return this.$t('fields.' + field + '.label');
          }
          return this.$t('fields.' + field);
        };
        return fields.slice(0, fields.length - 1).map(translate).join(', ')
          + (fields.length > 1 ? ' ' + this.$t('and') + ' ' : '')
          + translate(fields[fields.length - 1]);
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .journal {
    .md-layout {
      margin: 16px;
      > span {
        flex: 1;
        margin: 0 16px;
      }
    }
    .avatar {
      width: 100%;
    }
    .journal-resource {
      margin-top: 6px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(#000, 0.1);
    }
    > :last-child .journal-resource {
      padding-bottom: 0;
      border: none;
    }
  }
</style>