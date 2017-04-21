<style lang="scss" src="./mdEditor.scss"></style>

<template>
  <div :class="['md-editor', {'md-editor-notempty': !empty, 'md-editor-focused': focused}]">
    <input type="text" @focus="focused = true">
    <div ref="editor" class="md-editor-editor"></div>
    <slot></slot>
  </div>
</template>

<script>
  import Quill from 'quill';
  import Vue from 'vue';

  const presets = {
    normal: [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'link',
      { list: 'ordered' },
      { list: 'bullet' },
      'clean'
    ],
    small: [
      'bold',
      'italic',
      'underline',
      'strike',
      'link',
      { list: 'ordered' },
      { list: 'bullet' },
      'clean'
    ],
    mini: [
      'bold',
      'italic',
      'underline',
      'strike',
      'link',
      'clean'
    ]
  };

  /* global document */

  export default {
    props: {
      value: String,
      placeholder: String,
      disabled: Boolean,
      toolbar: {
        type: [String, Array],
        default: 'normal'
      },
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
            modules: {
              toolbar: typeof this.toolbar === 'string' ? presets[this.toolbar] : this.toolbar
            }
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

          this.toolbarElement = this.$el.querySelector('.ql-toolbar');
          document.body.addEventListener('click', this.detectFocus);

          this.$emit('editor-mounted', this.editor);
        }
      },
      destroyEditor() {
        if (this.editor && this.mounted) {
          this.focused = false;
          delete this.editor;
          this.$refs.editor.innerHTML = this.value || '';
          this.toolbarElement.parentNode.removeChild(this.toolbarElement);
          document.body.removeEventListener('click', this.detectFocus);

          this.$emit('editor-destroyed');
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
      },
      focus() {
        this.focused = true;
      },
      blur() {
        this.focused = false;
      }
    }
  };
</script>