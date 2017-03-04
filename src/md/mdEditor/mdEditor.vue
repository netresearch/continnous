<template>
  <div :class="['md-editor', {'md-editor-notempty': !empty, 'md-editor-focused': focused}]">
    <input type="text" @focus="focused = true">
    <div ref="editor" class="md-editor-editor"></div>
  </div>
</template>

<script>
  import Quill from 'quill';
  import Vue from 'vue';

  /* global document */

  export default {
    props: {
      value: String,
      placeholder: String,
      disabled: Boolean,
      allowClipboardAttributes: Boolean
    },
    extends: Vue.component('md-input').options,
    data() {
      return {
        empty: true,
        mounted: false,
        focused: false
      };
    },
    watch: {
      value: {
        immediate: true,
        handler(value) {
          if (this.editor) {
            const v = value || '';
            if (v !== this.getFilteredHTML()) {
              this.editor.root.innerHTML = v;
              this.editor.update('silent');
            }
          }
          if (!value) {
            this.empty = true;
          } else {
            this.$nextTick(() => {
              this.empty = this.isEmpty();
            });
          }
        }
      },
      focused(focused) {
        if (focused) {
          if (this.editor) {
            this.editor.focus();
          }
          this.onFocus();
        } else {
          if (this.editor) {
            this.editor.blur();
          }
          this.onBlur();
        }
      },
      disabled(disabled) {
        if (disabled) {
          this.destroyEditor();
        } else {
          this.buildEditor();
        }
      }
    },
    mounted() {
      this.mounted = true;
      this.buildEditor();
    },
    beforeDestroy() {
      this.destroyEditor();
      this.mounted = false;
    },
    methods: {
      detectFocus(event) {
        this.focused = this.$el.contains(event.target);
      },
      buildEditor() {
        if (!this.editor && this.mounted) {
          this.$refs.editor.innerHTML = this.value || '';

          this.editor = new Quill(this.$refs.editor, {
            theme: 'snow',
            placeholder: this.placeholder,
          });
          this.editor.on('text-change', () => {
            const value = this.getFilteredHTML();

            this.setParentValue();
            this.parentContainer.inputLength = value ? value.length : 0;
            this.$emit('change', value);
            this.$emit('input', value);
          });

          if (!this.allowClipboardAttributes) {
            this.editor.clipboard.matchers.forEach((matcher, i) => {
              if (matcher[1].toString().substr(0, 24) === 'function matchAttributor') {
                this.editor.clipboard.matchers.splice(i, 1);
              }
            });
          }

          this.toolbar = this.$el.querySelector('.ql-toolbar');
          document.body.addEventListener('click', this.detectFocus);
        }
      },
      destroyEditor() {
        if (this.editor && this.mounted) {
          this.focused = false;
          delete this.editor;
          this.$refs.editor.innerHTML = this.value || '';
          this.toolbar.parentNode.removeChild(this.toolbar);
          document.body.removeEventListener('click', this.detectFocus);
        }
      },
      getFilteredHTML() {
        return this.editor && this.getFilteredContent().length ? this.editor.root.innerHTML : '';
      },
      getFilteredContent() {
        if (!this.editor) {
          return '';
        }
        const content = this.editor.root.textContent || this.editor.root.innerText || '';
        return content.trim();
      },
      isEmpty() {
        return this.getFilteredContent().length === 0;
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  @import '~quill/dist/quill.snow.css';
  .md-editor {
    width: 100%;
    > input {
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      position: absolute;
      clip: rect(0 0 0 0);
      border: 0;
    }
    .ql-toolbar {
      margin-top: -2px;
      max-height: 1px;
      padding: 0;
      border: none;
      border-bottom: 1px solid rgba(#000, 0);
      overflow: visible;
      transition: max-height 0.2s, border-color 0.2s, padding 0.2s;
      position: relative;
      z-index: 1;
      button {
        color: #707070;
      }
    }
    &.md-editor-focused .ql-toolbar {
      z-index: 3;
      border-color: rgba(#000, 0.12);
      max-height: 72px;
      padding: 8px 0;
      transition: max-height 0.2s, border-color 0.2s, padding 0.2s, z-index 0s 0.2s;
    }
    .ql-container {
      background: #fff;
      z-index: 2;
      border: none;
      height: auto;
      font-family: inherit;
      line-height: inherit;
      margin-bottom: 2px;
    }
    .ql-editor {
      padding: 5px 0 3px;
      font-size: 16px;
      &.ql-blank:before {
        color: rgba(#000, 0.56);
        font-style: normal;
      }
    }
    .ql-stroke, .ql-stroke-miter {
      stroke: currentColor !important;
    }
    .ql-fill {
      fill: currentColor !important;
    }
  }
</style>