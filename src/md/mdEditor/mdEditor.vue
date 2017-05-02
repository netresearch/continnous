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
          this.setFilteredHTML(value);
          if (!value) {
            this.empty = true;
          }
        }
      },
      focused(focused) {
        if (this.parentContainer) {
          this.parentContainer.isFocused = focused;
        }
        if (this.editor) {
          if (focused) {
            this.editor.focus();
          } else {
            this.editor.blur();
          }
        }
      },
      disabled(disabled) {
        if (this.editor) {
          this.editor.enable(!disabled);
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
          this.setFilteredHTML(this.value);

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
              this.updateValues(value);
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
          document.body.addEventListener('mousedown', this.detectFocus);

          this.$emit('editor-mounted', this.editor);
        }
      },
      destroyEditor() {
        if (this.editor && this.mounted) {
          this.focused = false;
          delete this.editor;
          this.$refs.editor.innerHTML = this.value || '';
          this.toolbarElement.parentNode.removeChild(this.toolbarElement);
          document.body.removeEventListener('mousedown', this.detectFocus);

          this.$emit('editor-destroyed');
        }
      },
      setFilteredHTML(html) {
        const root = this.editor ? this.editor.root : this.$refs.editor;
        if (root && html !== this.getFilteredHTML()) {
          let h = html || '';
          if (h && !h.match(/^<(p|ul|ol|div|h[1-6]|blockquote)(\s|>)/)) {
            h = '<p>' + h + '</p>';
          }
          root.innerHTML = h;
          if (this.editor) {
            this.editor.update('silent');
          }
        }
      },
      getFilteredHTML() {
        let html = '';
        const root = this.editor ? this.editor.root : this.$refs.editor;
        if (root) {
          const nodes = root.childNodes;
          let l = nodes.length;
          if (l) {
            let start = 0;
            for (let i = 0; i < l; i++) {
              if (nodes[i].innerText.trim()) {
                break;
              }
              start = i;
            }
            for (let i = l - 1; i >= start; i--) {
              if (nodes[i].innerText.trim()) {
                break;
              }
              l--;
            }
            if (l === 1 && nodes[start].tagName === 'P' && !nodes[start].attributes.length) {
              html = nodes[start].innerHTML;
            } else {
              for (let i = start; i < l; i++) {
                html += nodes[i].outerHTML;
              }
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