<template>
  <md-editor
      ref="editor"
      :value="value"
      :placeholder="placeholder"
      :disabled="disabled"
      :toolbar="toolbar"
      @change="$emit('change', $event)"
      @input="$emit('input', $event)"
  >
    <md-mentions
        :providers="{'@': searchUsers}"
        :normalize="{'@': normalizeUser}"
    >
      <template scope="item">
        <avatar :user="item.value"></avatar>
      </template>
      <template slot="current" scope="item">
        <avatar :uid="item.id"></avatar>
      </template>
    </md-mentions>
  </md-editor>
</template>

<script>
  import 'highlight.js/styles/arduino-light.css';
  import highlight from 'highlight.js/lib/highlight';
  import searchMixin from './mixins/search';
  import Avatar from '../../Avatar';
  import { options, presets } from '../../../md/mdEditor/defaults';

  /* eslint-disable import/no-dynamic-require, global-require */
  ['xml', 'bash', 'css', 'javascript', 'java', 'less', 'php', 'scss', 'yaml', 'dockerfile'].forEach((l) => {
    highlight.registerLanguage(l, require('highlight.js/lib/languages/' + l));
  });

  options.modules = {
    syntax: {
      highlight: text => highlight.highlightAuto(text).value
    }
  };
  presets.normal.splice(presets.normal.indexOf('clean'), 0, 'code-block');

  export default {
    components: { Avatar },
    mixins: [searchMixin],
    props: {
      value: String,
      placeholder: String,
      disabled: Boolean,
      toolbar: {
        type: [String, Array],
        default: 'normal'
      },
    },
    methods: {
      normalizeUser(user) {
        return {
          id: user.uid,
          text: user.displayName
        };
      },
      focus() {
        this.$refs.editor.focus();
      },
      blur() {
        this.$refs.editor.blur();
      }
    },
    mounted() {
      const container = this.$parent.$parent.$refs.container;
      if (container) {
        this.$refs.editor.parentContainer = container;
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .md-editor {
    .ql-snow .ql-editor pre.ql-syntax {
      background: #fafafa;
      color: rgba(0, 0, 0, 0.87);
    }
  }
</style>