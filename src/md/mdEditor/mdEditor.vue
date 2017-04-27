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
      { header: [1, 2, 3, 4, 5, false] },
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
              this.editor.root.innerHTML = this.restoreHTML(v);
              this.editor.update('silent');
            }
          }
          if (!value) {
            this.empty = true;
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
          this.$refs.editor.innerHTML = this.restoreHTML(this.value || '');

          this.editor = new Quill(this.$refs.editor, {
            theme: 'snow',
            placeholder: this.placeholder,
            modules: {
              toolbar: typeof this.toolbar === 'string' ? presets[this.toolbar] : this.toolbar
            }
          });
          this.editor.on('text-change', () => {
            const value = this.getFilteredHTML();
            if (value !== this.value) {
              this.setParentValue();
              this.parentContainer.inputLength = value ? value.length : 0;
              this.$emit('change', value);
              this.$emit('input', value);
            }
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
      restoreHTML(html) {
        if (html && !html.match(/^<(p|ul|ol|div|h[1-6]|blockquote)(\s|>)/)) {
          return '<p>' + html + '</p>';
        }
        return html;
      },
      getFilteredHTML() {
        let html = '';
        if (this.editor) {
          const nodes = this.editor.root.childNodes;
          let l = nodes.length;
          if (l === 1 && nodes[0].tagName === 'P' && !nodes[0].attributes.length) {
            html = nodes[0].innerHTML;
          } else if (l) {
            let start = 0;
            for (let i = 0; i < l; i++) {
              if (nodes[i].innerText.trim()) {
                break;
              }
              start++;
            }
            for (let i = l - 1; i >= start; i--) {
              if (nodes[i].innerText.trim()) {
                break;
              }
              l--;
            }
            for (let i = start; i < l; i++) {
              html += nodes[i].outerHTML;
            }
          }
        }
        return html;
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