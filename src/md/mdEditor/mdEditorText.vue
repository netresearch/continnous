<template>
  <div class="md-editor-text ql-snow">
    <div class="ql-editor" v-if="formatedText" v-html="formatedText"></div>
  </div>
</template>

<script>
  export default {
    props: {
      text: String,
      autolink: {
        type: [Boolean, Object],
        default() {
          return {
            phone: false,
            mention: false,
          };
        }
      }
    },
    computed: {
      formatedText() {
        if (!this.text || !this.autolink) {
          return this.text;
        }
        /* eslint-disable global-require */
        const Autolinker = require('autolinker');

        return Autolinker.link(this.text, typeof this.autolink === 'object' ? this.autolink : {});
      }
    }
  };
</script>

<style>
  .md-editor-text .ql-editor {
    padding: 0;
  }
</style>