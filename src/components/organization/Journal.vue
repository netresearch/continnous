<template>
  <div :class="['journal', {'journal-reverse': reverse}]">
    <div class="journal-group" v-for="(group, g) in groups">
      <avatar :organization="organization" :uid="group.uid">
        <template scope="avatar">
          <!--
          groups[g] instead of simply group is here because otherwise vue doesn't update on new group entries
          maybe because of the uid property
          -->
          <div class="journal-entry" v-for="(entry, i) in groups[g]">
            <span class="avatar-name" v-if="i === 0">{{avatar.user.displayName}}</span>
            <span class="journal-predicate">
              <md-icon v-if="i > 0" class="md-mini">arrow_{{reverse ? 'down' : 'up'}}ward</md-icon>
              {{$t('journal.' + entry.action, { fields: joinFields(entry.fields) })}}
              {{entry.fields && !noResource ? $t('journal.on') : ''}}
            </span>
            <span v-if="!noResource" class="journal-resource">
              <router-link :to="organization.key + '/' + entry.resource + '/' + (entry.personal ? 'personal/' : '') + entry.id" class="md-icon-link">
                <md-icon class="md-small">{{resources[entry.resource].icon}}</md-icon>
                {{entry.title}}
              </router-link>
            </span>
            <div class="md-caption">{{formatTime(entry.time)}}</div>
          </div>
        </template>
      </avatar>
    </div>
  </div>
</template>

<script>
  import moment from 'moment';
  import sortBy from 'sort-by';
  import Config from '../../models/Config';
  import auth from '../../auth';
  import Avatar from '../Avatar';
  import Firebase from '../../firebase';

  export default {
    components: { Avatar },
    props: {
      organization: Object,
      item: Object,
      noResource: Boolean,
      reverse: Boolean
    },
    data() {
      return {
        resources: Config.resources,
        auth,
        groups: [],
        entries: []
      };
    },
    watch: {
      organization: {
        immediate: true,
        handler() {
          this.$nextTick(() => {
            this.entries = [];
            if (this.ref) {
              this.ref.off('child_added');
              this.ref.off('child_removed');
            }
            if (this.organization) {
              const journalRef = this.organization.journal.getRef();
              console.log(this.item, this.organization);
              if (this.item) {
                this.ref = journalRef.orderByChild('id').equalTo(this.item.id);
              } else {
                this.ref = journalRef.orderByChild('personal').equalTo(false).limitToLast(10);
              }
              this.ref.on('child_added', this.onEntryAdded);
              this.ref.on('child_removed', this.onEntryRemoved);
            }
          });
        }
      },
    },
    methods: {
      groupEntries() {
        this.entries.sort(sortBy((this.reverse ? '' : '-') + 'time'));
        const groups = [];
        let lastGroup;
        this.entries.forEach((entry) => {
          if (!lastGroup || lastGroup.uid !== entry.uid) {
            lastGroup = [];
            lastGroup.uid = entry.uid;
            groups.push(lastGroup);
          }
          lastGroup.push(entry);
          lastGroup.sort(sortBy((this.reverse ? '' : '-') + 'time'));
        });
        this.groups = groups;
      },
      onEntryAdded(snapshot) {
        const entry = Object.assign({ journalId: snapshot.key }, snapshot.val());
        const addEntry = () => {
          this.entries.push(entry);
          this.groupEntries();
        };
        if (this.noResource) {
          addEntry();
        } else {
          const path = '/' + (entry.action === 'remove' ? 'trash' : 'resources')
              + '/organizations/' + this.organization.key
              + '/' + (entry.personal ? this.item.creator : 'organization')
              + '/' + entry.resource
              + '/' + entry.id + '/title';
          Firebase.database().ref(path).once('value', (s) => {
            entry.title = s.val();
            if (entry.title) {
              addEntry();
            }
          }, () => {});
        }
      },
      onEntryRemoved(snapshot) {
        this.entries.forEach((entry, i) => {
          if (entry.journalId === snapshot.key) {
            this.entries.splice(i, 1);
            this.groupEntries();
          }
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
    .journal-entry {
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