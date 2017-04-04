<template>
  <div class="resource-detail-comment">
    <avatar :organization="organization" uid="current" no-name></avatar>
    <md-input-container>
      <md-textarea
          v-model="text"
          ref="textarea"
          @focus.native="focused = true; updateTextarea()"
          @blur.native="focused = false; updateTextarea()"
          :placeholder="$t('actions.writeComment') + '...'"></md-textarea>
      <md-icon
          ref="button"
          @click.native="save()"
          :class="['resource-comment-send', {'resource-comment-send-disabled': !text.trim().length}]"
      >add_box</md-icon>
    </md-input-container>
  </div>
</template>

<script>
  import Avatar from '../../../Avatar';

  export default {
    components: { Avatar },
    props: ['organization', 'type', 'item', 'personal'],
    data() {
      return {
        focused: false,
        text: ''
      };
    },
    methods: {
      updateTextarea() {
        this.$nextTick(() => {
          /* global document */
          const evt = document.createEvent('Event');
          evt.initEvent('autosize:update', true, false);
          this.$refs.textarea.$el.dispatchEvent(evt);
        });
      },
      save() {
        const text = this.text.trim().replace(/\r/g, '');
        if (!text.length) {
          this.$refs.textarea.focus();
        } else {
          this.organization.journal.addEntry(
            this.type,
            this.personal,
            this.item.id,
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
  .resource-detail-comment {
    margin-top: 16px;
    display: flex;
    flex-flow: row wrap;
    .md-input-container {
      min-height: 0;
      flex: 1;
      margin: 0;
      margin-left: 10px;
      padding-top: 5px;
      min-width: 100px;
      &:after {
        opacity: 0;
      }
      .resource-comment-send {
        cursor: pointer;
        opacity: 0;
        &:after {
          display: none;
        }
        &.resource-comment-send-disabled {
          color: rgba(#000, 0.54) !important;
          cursor: default;
        }
      }
      &.md-input-focused {
        .resource-comment-send {
          opacity: 1;
        }
        &:after {
          opacity: 1;
        }
      }
    }
  }
</style>