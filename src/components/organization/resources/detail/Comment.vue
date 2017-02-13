<template>
  <md-input-container class="resource-comment">
    <label><md-icon class="md-small">comment</md-icon>Comment</label>
    <md-textarea
        :value="focused ? text : ''"
        ref="textarea"
        @input="text = $event"
        @focus.native="focused = true; updateTextarea()"
        @blur.native="focused = false; updateTextarea()"
        placeholder="Add comment..."></md-textarea>
    <md-icon
        ref="button"
        @click.native="save()"
        :class="['resource-comment-send', {'resource-comment-send-disabled': !text.replace(/^\s*(.+)\s*$/, '$1').length}]"
    >add_box</md-icon>
  </md-input-container>
</template>

<script>
  export default {
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
        if (this.$refs.button.$el.classList.contains('resource-comment-send-disabled')) {
          this.$refs.textarea.focus();
        } else {
          this.organization.journal.addEntry(
            this.type,
            this.personal,
            this.item.id,
            'comment',
            undefined,
            this.text
          );
          this.$emit('comment', this.text);
          this.text = '';
        }
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">

  .md-input-container.resource-comment {
    margin-bottom: 16px;
    padding-left: 22px;
    padding-top: 20px;
    padding-bottom: 4px;
    margin-top: 8px;
    min-height: 56px;
    overflow: hidden;
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
      padding-left: 0;
      padding-bottom: 2px;
      padding-top: 24px;
      .resource-comment-send {
        opacity: 1;
      }
    }
    label {
      .md-icon {
        margin-right: 6px;
        &:after {
          display: none;
        }
      }
      opacity: 1;
      top: 0;
    }
  }
</style>