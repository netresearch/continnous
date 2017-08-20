<template>
  <div :class="['journal', {'journal-reverse': reverse}]">
    <div class="journal-group" v-for="group in (entries ? entries.groups : [])">
      <avatar :uid="group.uid">
        <template scope="avatar">
          <div class="journal-entry" v-for="(entry, i) in group">
            <span class="avatar-name" v-if="i === 0">{{avatar.user.displayName}}</span>
            <div class="journal-time">
              <md-icon v-if="i > 0" class="md-mini">arrow_{{reverse ? 'down' : 'up'}}ward</md-icon>{{formatTime(entry.time)}}
            </div>
            <span class="journal-predicate">
              {{$t('journal.' + entry.action, { fields: joinFields(entry.fields), resource: '###' }).split('###').shift()}}
              {{entry.fields && !item ? $t('journal.on') : ''}}
            </span>
            <span v-if="!item" class="journal-resource">
              <router-link :to="getUrlPath({id: entry.item.id, personal: entry.personal, type: entry.resource})" class="md-icon-link">
                <md-icon class="md-small">{{resources[entry.resource].icon}}</md-icon>
                {{entry.item.title}}
              </router-link>
            </span>
            <span class="journal-predicate" v-else-if="!entry.fields && entry.action !== 'comment'">{{$t('journal.this')}}</span>
            <span class="journal-predicate" v-if="entry.action !== 'comment'">
              {{$t('journal.' + entry.action, { fields: joinFields(entry.fields), resource: '###' }).replace(/^[^#]+(###(.*))?$/,'$2')}}
            </span>
          </div>
        </template>
      </avatar>
    </div>
    <p class="md-caption journal-empty" style="justify-content: center" v-if="!noEmptyMessage && entries && !entries.length">{{$t('journal.empty')}}</p>
  </div>
</template>

<script>
  import moment from 'moment';
  import Config from '../../../models/Config';
  import Avatar from '../../Avatar';
  import Current from '../../../models/Current';

  export default {
    components: { Avatar },
    props: {
      item: Object,
      reverse: Boolean,
      actions: [String, Array],
      noEmptyMessage: Boolean
    },
    data() {
      return {
        resources: Config.resources,
        entries: undefined,
        deleteComment: {},
        editComment: undefined,
        Current
      };
    },
    watch: {
      'Current.organization': {
        immediate: true,
        handler: 'loadEntries'
      },
      item: 'loadEntries'
    },
    methods: {
      loadEntries() {
        this.$nextTick(() => {
          if (this.entries) {
            this.entries.off();
          }
          if (!Current.organization) {
            return;
          }
          this.entries = Current.organization.journal.getEntries(this.item, {
            reverse: this.reverse,
            onBeforeAdd: (entry) => {
              if (this.actions) {
                const actions = typeof this.actions === 'string' ? [this.actions] : this.actions;
                if (actions.indexOf(entry.action) < 0) {
                  return false;
                }
              }
              return true;
            }
          });
        });
      },
      formatTime(time) {
        return moment(time).calendar();
      },
      joinFields(fields) {
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
  .md-list .journal {
    margin: 8px 16px;
  }
  .journal {
    .journal-group {
      margin-bottom: 16px;
      &:last-child {
        margin-bottom: 0;
      }
    }
    .avatar {
      width: 100%;
    }
    .journal-predicate {
      color: rgba(0, 0, 0, .57);
    }
    .journal-time {
      color: rgba(0, 0, 0, .57);
      font-size: 12px;
      line-height: 17px;
      .md-icon {
        margin-right: 2px;
        top: -1px;
        position: relative;
      }
    }
    .journal-entry {
      cursor: default;
      margin-bottom: 10px;
      &:last-child {
        margin-bottom: 0;
      }
    }
    > :last-child .journal-resource {
      padding-bottom: 0;
      border: none;
    }
  }
</style>