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
            <div class="journal-time">
              <md-icon v-if="i > 0" class="md-mini">arrow_{{reverse ? 'down' : 'up'}}ward</md-icon>{{formatTime(entry.time)}}
            </div>
            <div class="journal-comment" v-if="noResource && entry.action === 'comment'">
              <span v-if="!editComment || editComment.journalId !== entry.journalId">{{entry.comment}}</span>
              <md-input-container v-else>
                <md-textarea
                    ref="commentInputs"
                    v-model="editComment.comment"
                    :placeholder="$t('actions.writeComment') + '...'"></md-textarea>
                <md-icon
                    @click.native="saveComment(entry)"
                    :class="['md-primary', 'resource-comment-save', {'resource-comment-save-disabled': editComment.comment.trim() === entry.comment || !editComment.comment.trim().length}]"
                >done</md-icon>
                <md-icon @click.native="editComment = undefined" class="md-warn md-icon-delete">block</md-icon>
              </md-input-container>
              <div class="journal-comment-actions" v-if="noResource">
                <template v-if="entry.uid === auth.user.uid">
                  <span v-if="!editComment || editComment.journalId !== entry.journalId">
                    <span @click="editComment = Object.assign({}, entry); $nextTick(function() { $nextTick(function() { $refs.commentInputs[0].$el.focus(); }); })">{{$t('actions.edit')}}</span>
                  </span>
                  <span>
                    <span @click="deleteComment = entry; $refs.dialog.open()">{{$t('actions.delete')}}</span>
                  </span>
                </template>
              </div>
            </div>
            <span class="journal-predicate" v-else>
              {{$t('journal.' + entry.action, { fields: joinFields(entry.fields), resource: '###' }).split('###').shift()}}
              {{entry.fields && !noResource ? $t('journal.on') : ''}}
            </span>
            <span v-if="!noResource" class="journal-resource">
              <router-link :to="getUrlPath({id: entry.id, personal: entry.personal, type: entry.resource})" class="md-icon-link">
                <md-icon class="md-small">{{resources[entry.resource].icon}}</md-icon>
                {{entry.title}}
              </router-link>
            </span>
            <span class="journal-predicate" v-else-if="!entry.fields && entry.action !== 'comment'">{{$t('journal.this')}}</span>
            <span class="journal-predicate" v-if="!noResource || entry.action !== 'comment'">
              {{$t('journal.' + entry.action, { fields: joinFields(entry.fields), resource: '###' }).replace(/^[^#]+(###(.*))?$/,'$2')}}
            </span>
          </div>
        </template>
      </avatar>
    </div>
    <p class="md-caption journal-empty" style="justify-content: center" v-if="!noEmptyMessage && !entries.length">{{$t('journal.empty')}}</p>
    <md-dialog-confirm
        v-if="noResource"
        ref="dialog"
        :md-title="$t('journal.confirmCommentDelete')"
        :md-content="deleteComment.comment || 'bla'"
        :md-ok-text="$t('actions.delete')"
        :md-cancel-text="$t('actions.cancel')"
        @close="$event === 'ok' ? doDeleteComment() : null"
    ></md-dialog-confirm>
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
      reverse: Boolean,
      actions: [String, Array],
      noEmptyMessage: Boolean
    },
    data() {
      return {
        resources: Config.resources,
        auth,
        groups: [],
        entries: [],
        deleteComment: {},
        editComment: undefined
      };
    },
    watch: {
      organization: {
        immediate: true,
        handler: 'loadEntries'
      },
      item: 'loadEntries'
    },
    methods: {
      saveComment(originalComment) {
        if (this.editComment) {
          const comment = this.editComment.comment.trim();
          if (comment && comment !== originalComment.comment) {
            this.organization.journal.getRef()
              .child(this.editComment.journalId)
              .child('comment')
              .set(comment);
            this.editComment = undefined;
          } else {
            this.commentInputs[0].$el.focus();
          }
        }
      },
      doDeleteComment() {
        this.organization.journal.getRef().child(this.deleteComment.journalId).remove();
      },
      loadEntries() {
        this.$nextTick(() => {
          this.entries = [];
          this.groups = [];
          if (this.ref) {
            this.$emit('update', this);
            this.ref.off('child_added');
            this.ref.off('child_removed');
            this.ref.off('child_changed');
          }
          if (this.organization) {
            const journalRef = this.organization.journal.getRef();
            if (this.item) {
              this.ref = journalRef.orderByChild('id').equalTo(this.item.id);
            } else {
              this.ref = journalRef.orderByChild('personal').equalTo(false).limitToLast(10);
            }
            this.ref.on('child_added', this.onEntryAdded);
            this.ref.on('child_removed', this.onEntryRemoved);
            this.ref.on('child_changed', this.onEntryChanged);
          }
        });
      },
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
        if (this.actions) {
          const actions = typeof this.actions === 'string' ? [this.actions] : this.actions;
          if (actions.indexOf(entry.action) < 0) {
            return;
          }
        }
        const addEntry = () => {
          this.entries.push(entry);
          this.groupEntries();
          this.$emit('update', this);
        };
        if (this.noResource) {
          addEntry();
        } else {
          const load = (archive, tryArchiveOpposite) => {
            const path = '/' + (archive ? 'archive' : 'resources')
              + '/organizations/' + this.organization.key
              + '/' + (entry.personal ? this.item.creator : 'organization')
              + '/' + entry.resource
              + '/' + entry.id + '/title';
            Firebase.database().ref(path).once('value', (s) => {
              entry.title = s.val();
              if (entry.title) {
                addEntry();
              } else if (tryArchiveOpposite && (entry.action === 'archive' || entry.action === 'unarchive')) {
                load(!archive);
              }
            }, () => { });
          };
          load(entry.action === 'archive', true);
        }
      },
      onEntryRemoved(snapshot) {
        this.entries.forEach((entry, i) => {
          if (entry.journalId === snapshot.key) {
            this.entries.splice(i, 1);
            this.groupEntries();
            this.$emit('update', this);
          }
        });
      },
      onEntryChanged(snapshot) {
        this.entries.forEach((entry) => {
          if (entry.journalId === snapshot.key) {
            Object.assign(entry, snapshot.val());
            this.$emit('update', this);
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
    .journal-comment {
      > span {
        white-space: pre;
        flex: 0 0 0;
      }
      .md-input-container {
        margin: -18px 0 6px;
        .md-icon {
          margin-left: 12px;
          cursor: pointer;
          &.resource-comment-save-disabled {
            color: rgba(#000, 0.56) !important;
            cursor: default;
            pointer-events: none;
          }
        }
      }
      .journal-comment-actions {
        overflow: hidden;
        position: relative;
        top: 4px;
        > span {
          float: left;
          color: rgba(0, 0, 0, .57);
          font-size: 12px;
          &, * {
            line-height: 12px;
          }
          span {
            cursor: pointer;
            &:hover {
              text-decoration: underline;
            }
          }
          &:before {
            content: '•';
            padding: 0 5px;
            text-decoration: none !important;
          }
          &:first-child:before {
            display: none;
          }
        }
      }
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