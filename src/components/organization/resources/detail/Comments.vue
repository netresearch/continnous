<template>
  <div class="comments">
    <div class="comment-group" v-for="group in (comments ? comments.groups : [])">
      <avatar :organization="organization" :uid="group.uid">
        <template scope="avatar">
          <div class="comment" :class="{ 'current-edit': editComment === comment }" v-for="(comment, i) in group">
            <span class="avatar-name" v-if="i === 0">{{avatar.user.displayName}}</span>
            <div class="comment-time">
              <md-icon v-if="i > 0" class="md-mini">arrow_downward</md-icon>{{moment(comment.time).calendar()}}
            </div>
            <editor-text :organization="organization" :text="comment.comment"></editor-text>
            <div class="comment-actions">
              <template v-if="comment.uid === auth.user.uid">
                  <span v-if="!editComment || editComment !== comment">
                    <span @click="editComment = comment">{{$t('actions.edit')}}</span>
                  </span>
                <span>
                  <span @click="deleteComment = comment; $refs.dialog.open()">{{$t('actions.delete')}}</span>
                </span>
              </template>
            </div>
          </div>
        </template>
      </avatar>
    </div>

    <md-input-container ref="form">
      <div class="comment-form-whiteframe"></div>
      <avatar :organization="organization" uid="current" no-name></avatar>
      <editor
          v-model="text"
          ref="editor"
          toolbar="mini"
          :disabled="saving"
          :class="{'md-editor-sticky-toolbar': !!text || editComment }"
          :organization="organization"
          :placeholder="$t('actions.writeComment') + '...'"></editor>
      <div class="comment-form-buttons">
        <md-button
            @click.native="save()"
            :disabled="!text || saving"
            class="md-primary md-raised"
        >{{$t('actions.' + (editComment ? 'update' : 'post') + 'Comment')}}</md-button>
        <md-button
            @click.native="$refs.editor.blur(); editComment = undefined; text = ''"
            :disabled="saving"
        >Cancel</md-button>
      </div>
    </md-input-container>

    <md-dialog-confirm
        ref="dialog"
        :md-title="$t('journal.confirmCommentDelete')"
        :md-content="deleteComment ? deleteComment.comment : ' '"
        :md-ok-text="$t('actions.delete')"
        :md-cancel-text="$t('actions.cancel')"
        @close="$event === 'ok' ? deleteComment.remove() : null"
    ></md-dialog-confirm>
  </div>
</template>

<script>
  import moment from 'moment';
  import Avatar from '../../../Avatar';
  import Editor from '../../common/Editor';
  import EditorText from '../../common/EditorText';
  import auth from '../../../../auth';

  export default {
    components: { Avatar, Editor, EditorText },
    props: {
      organization: Object,
      item: Object
    },
    data() {
      return {
        comments: undefined,
        text: '',
        saving: false,
        editComment: undefined,
        deleteComment: undefined,
        auth,
        moment
      };
    },
    watch: {
      organization: {
        immediate: true,
        handler: 'loadEntries'
      },
      item: 'loadEntries',
      editComment(comment) {
        this.text = comment ? comment.comment : '';
        this.positionForm();
        if (comment) {
          this.$nextTick(() => {
            this.$refs.editor.focus();
          });
        }
      }
    },
    methods: {
      loadEntries() {
        this.$nextTick(() => {
          if (this.comments) {
            this.comments.off();
          }
          if (!this.organization) {
            return;
          }
          this.comments = this.organization.journal.getEntries(this.item, {
            reverse: true,
            onBeforeAdd: entry => entry.action === 'comment'
          });
        });
      },
      save() {
        if (!this.text.length) {
          this.$refs.editor.focus();
          return;
        }
        this.$refs.editor.blur();
        this.saving = true;
        const { item, text, editComment } = this;
        let p;
        if (editComment) {
          p = editComment.updateComment(text);
        } else {
          p = this.organization.journal.addEntry(item, 'comment', undefined, text);
        }
        p.then(() => {
          this.text = '';
          this.$timeOut(() => {
            this.editComment = undefined;
            this.saving = false;
          }, 500);
        });
      },
      positionForm() {
        this.$nextTick(() => {
          const form = this.$refs.form.$el;
          if (this.editComment) {
            const commentEl = this.$el.querySelector('.current-edit');
            if (commentEl && form.parentNode !== commentEl) {
              commentEl.appendChild(form);
            }
          } else if (!this.editComment && form.parentNode !== this.$el) {
            this.$el.appendChild(form);
          }
        });
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">

  $buttons-height: 36px;
  $buttons-padding: 10px;
  $avatar-width: 30px;

  .comments {
    .comment-group {
      margin-bottom: 16px;
      &:last-child {
        margin-bottom: 0;
      }
    }
    .comment {
      cursor: default;
      margin-bottom: 10px;
      &:last-child {
        margin-bottom: 0;
      }
      .comment-time {
        color: rgba(0, 0, 0, .56);
        font-size: 12px;
        line-height: 17px;
        .md-icon {
          margin-right: 2px;
          top: -1px;
          position: relative;
        }
      }
      .comment-actions {
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
      &.current-edit {
        .comment-actions, .md-editor-text {
          display: none;
        }
        .md-input-container {
          padding-left: $buttons-padding;
          padding-right: $buttons-padding;
          margin-top: 6px;
          .comment-form-whiteframe {
            top: 0;
            left: 0;
            right: 0;
          }
          .avatar {
            display: none;
          }
          .md-editor {
            margin-top: 0;
          }
          &:after, .comment-form-buttons {
            left: $buttons-padding;
            right: $buttons-padding;
          }
        }
      }
    }

    .md-input-container {
      min-height: 0;
      flex: 1;
      margin: 16px 0 0;
      padding-top: 0;
      min-width: 100px;
      transition: margin 0.4s;
      &:after {
        opacity: 0;
        z-index: 3;
        left: $avatar-width + $buttons-padding;
      }
      .comment-form-whiteframe {
        box-shadow: 0px 1px 8px 0px rgba(0, 0, 0, 0.3);
        position: absolute;
        opacity: 0;
        top: -6px;
        left: -$buttons-padding;
        right: -$buttons-padding;
        bottom: 0;
        transition: opacity 0.2s, bottom 0.4s;
      }
      .avatar {
        margin-right: $buttons-padding;
      }
      .md-editor {
        background: #fff !important;
        z-index: 2;
        margin-top: 5px;
        transition: margin-top 0.2s;
      }
      .comment-form-buttons {
        position: absolute;
        z-index: 1;
        top: 0;
        opacity: 0;
        right: 0;
        left: $avatar-width + $buttons-padding;
        transition: top 0.4s, opacity 0.4s;
        margin-top: $buttons-padding;
        .md-button {
          margin: 0;
          &:not(.md-primary) {
            float: right;
          }
        }
      }
      &.md-input-focused,
      &.md-has-value {
        margin: 16px + $buttons-padding 0 $buttons-height + $buttons-padding * 2;
        &:after {
          opacity: 1;
        }
        .md-editor {
          margin-top: 0;
        }
        .comment-form-whiteframe {
          bottom: -1 * ($buttons-height + $buttons-padding * 2);
          opacity: 1;
        }
        .comment-form-buttons {
          top: 100%;
          opacity: 1;
        }
      }
    }
  }
</style>