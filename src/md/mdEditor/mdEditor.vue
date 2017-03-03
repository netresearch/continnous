<template>
  <div :class="['md-editor', {'md-editor-notempty': !empty}]">
    <div ref="toolbar" class="md-editor-toolbar"></div>
    <div ref="editor" class="md-editor-editor"></div>
  </div>
</template>

<script>
  import Vue from 'vue';
  import MediumEditor from 'medium-editor';
  import extend from 'extend';

  const iconMap = {
    anchor: 'link',
    bold: 'format_bold',
    italic: 'format_italic',
    underline: 'format_underline',
    strikethrough: 'strikethrough_s',
    // superscript: '',
    // subscript: '',
    image: 'insert_photo',
    // html: '',
    orderedlist: 'format_list_numbered',
    unorderedlist: 'format_list_bulleted',
    indent: 'format_indent_increase',
    outdent: 'format_indent_decrease',
    justifyCenter: 'format_align_center',
    justifyFull: 'format_align_justify',
    justifyLeft: 'format_align_left',
    justifyRight: 'format_align_right',
    removeFormat: 'format_clear',
    quote: 'format_quote',
    pre: 'code',
    // h1: '',
    // h2: '',
    // h3: '',
    // h4: '',
    // h5: '',
    // h6: '',
  };
  
  export default {
    props: {
      value: String,
      placeholder: String,
      disabled: Boolean,
      options: Object
    },
    extends: Vue.component('md-input').options,
    data() {
      return {
        empty: true
      };
    },
    watch: {
      value: {
        immediate: true,
        handler(value) {
          if (this.$refs.editor) {
            const v = value === undefined ? '' : value;
            if (this.getFilteredContent() !== v) {
              this.$refs.editor.innerHTML = v;
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
      }
    },
    computed: {
      mergedOptions() {
        return extend(true, {
          targetBlank: true,
          autoLink: true,
          placeholder: {
            text: this.placeholder,
            hideOnClick: true
          },
          toolbar: {
            static: true,
            updateOnEmptySelection: true,
            buttons: [
              'bold',
              'italic',
              'underline',
              'strikethrough',
              'anchor',
              'quote',
              'h2', 'h3',
              'unorderedlist',
              'orderedlist'
            ]
          }
        }, this.options);
      }
    },
    mounted() {
      this.$refs.editor.innerHTML = this.value || '';

      if (!this.mergedOptions.toolbar.hasOwnProperty('relativeContainer')) {
        this.mergedOptions.toolbar.relativeContainer = this.$refs.toolbar;
      }
      this.editor = new MediumEditor(this.$refs.editor, this.mergedOptions);
      this.editor.subscribe('focus', this.onFocus);
      this.editor.subscribe('blur', this.onBlur);

      this.editor.subscribe('blur', () => {
        if (this.isEmpty()) {
          this.$refs.editor.innerHTML = '';
        }
      });
      this.editor.subscribe('editableInput', () => {
        const value = this.getFilteredContent();
        this.setParentValue();
        this.parentContainer.inputLength = value ? value.length : 0;
        this.$emit('change', value);
        this.$emit('input', value);
      });

      Object.keys(iconMap).forEach((action) => {
        this.$refs.toolbar.querySelectorAll('button.medium-editor-action-' + action).forEach((button) => {
          button.innerHTML = '<i class="md-icon material-icons">' + iconMap[action] + '</i>';
        });
      });
    },
    beforeDestroy() {
      if (this.editor) {
        this.editor.destroy();
      }
    },
    methods: {
      getFilteredContent() {
        if (!this.$refs.editor) {
          return '';
        }
        const content = this.$refs.editor.textContent || this.$refs.editor.innerText || '';
        return content.trim();
      },
      isEmpty() {
        return this.getFilteredContent().length === 0;
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  @import '~medium-editor/dist/css/medium-editor.css';
  .md-editor {
    margin: -1em 0;
    position: relative;
    top: 3px;
    .md-editor-toolbar {
      max-height: 1px;
      overflow: hidden;
      opacity: 0;
      transition: all 0.2s;
      position: relative;
      z-index: 0;
      .medium-editor-toolbar {
        visibility: visible;
        position: relative;
      }
    }
    .md-editor-editor {
      font-size: 16px;
      position: relative;
      z-index: 1;
      margin: 1em 0;
      min-height: 20px;
      &:focus {
        outline: none;
      }
      &:after {
        margin: 0;
        color: rgba(#000, .54);
        font-style: normal;
        font-size: 16px;
        cursor: text;
      }
    }
    &.md-editor-notempty .md-editor-editor:after {
      display: none;
    }
  }
  .md-input-focused {
    .md-editor {
      margin: 0;
      .md-editor-toolbar {
        transition: all 0.2s;
        max-height: 500px;
        opacity: 1;
        margin-bottom: -3px;
      }
    }
  }

  /* --------------------- Editor theme -------------------------*/
  .md-editor {
    width: 100%;

    .medium-toolbar-arrow-under:after {
      top: 60px;
      border-color: #57ad68 transparent transparent transparent;
    }
    .medium-toolbar-arrow-over:before {
      top: -8px;
      border-color: transparent transparent #57ad68 transparent;
    }

    .medium-editor-toolbar {
      border-bottom: 1px solid rgba(#000, 0.12);
      li {
        padding: 0;
        button {
          min-width: 40px;
          height: 40px;
          padding: 8px;
          border: none;
          background-color: transparent;
          -webkit-transition: background-color .2s ease-in, color .2s ease-in;
          transition: background-color .2s ease-in, color .2s ease-in;

          text-decoration: none;
          line-height: 24px;
          b {
            font-size: 18px;
            line-height: 24px;
          }
          .md-icon {
            margin: 0;
          }
        }
      }

      .medium-editor-toolbar-form {
        .medium-editor-toolbar-input {
          height: 60px;
          background: #57ad68;
          color: #fff;
          &::-webkit-input-placeholder {
            color: #fff;
            color: rgba(255, 255, 255, 0.8);
          }
          &:-moz-placeholder {
            /* Firefox 18- */
            color: #fff;
            color: rgba(255, 255, 255, 0.8);
          }
          &::-moz-placeholder {
            /* Firefox 19+ */
            color: #fff;
            color: rgba(255, 255, 255, 0.8);
          }
          &:-ms-input-placeholder {
            color: #fff;
            color: rgba(255, 255, 255, 0.8);
          }
        }
        a {
          color: #fff;
        }
      }

      .medium-editor-toolbar-anchor-preview {
        background: #57ad68;
        color: #fff;
      }

      .medium-editor-placeholder:after {
        color: #9ccea6;
      }
    }
  }
</style>