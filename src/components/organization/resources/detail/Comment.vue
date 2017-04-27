<template>
  <md-input-container class="resource-detail-comment">
    <div class="resource-detail-comment-whiteframe"></div>
    <avatar :organization="organization" uid="current" no-name></avatar>
    <editor
        v-model="text"
        ref="editor"
        toolbar="mini"
        :class="{'md-editor-sticky-toolbar': !!text.trim()}"
        :organization="organization"
        :placeholder="$t('actions.writeComment') + '...'"></editor>
    <div class="resource-detail-comment-buttons">
      <md-button
          @click.native="save()"
          :disabled="!text.trim().length"
          class="md-primary md-raised"
      >Post comment</md-button>
      <md-button @click.native="$refs.editor.blur(); text = ''">Cancel</md-button>
    </div>
  </md-input-container>
</template>

<script>
  import Avatar from '../../../Avatar';
  import mixin from '../mixin';
  import Editor from '../../common/Editor';

  export default {
    components: { Avatar, Editor },
    props: ['organization', 'type', 'item', 'personal'],
    mixins: [mixin],
    data() {
      return {
        text: ''
      };
    },
    methods: {
      save() {
        const text = this.text;
        if (!text.length) {
          this.$refs.editor.focus();
        } else {
          this.organization.journal.addEntry(
            this.item,
            this.type,
            this.personal,
            'comment',
            undefined,
            text
          );
          this.$emit('comment', this.text);
          this.text = '';
        }
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  $buttons-height: 36px;
  $buttons-padding: 10px;
  $avatar-width: 30px;
  .resource-detail-comment {
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
    .resource-detail-comment-whiteframe {
      box-shadow: 0px 1px 8px 0px rgba(0,0,0,0.3);
      position: absolute;
      opacity: 0;
      top: -6px;
      left: -$buttons-padding;
      right: -$buttons-padding;
      bottom: 0;
      transition: opacity 0.2s, bottom 0.4s;
    }
    .md-editor {
      background: #fff !important;
      z-index: 2;
      margin-left: $buttons-padding;
      margin-top: 5px;
      transition: margin-top 0.2s;
    }
    .resource-detail-comment-buttons {
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
      .resource-detail-comment-whiteframe {
        bottom: -1 * ($buttons-height + $buttons-padding * 2);
        opacity: 1;
      }
      .resource-detail-comment-buttons {
        top: 100%;
        opacity: 1;
      }
    }
  }
</style>