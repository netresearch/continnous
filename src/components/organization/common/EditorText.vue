<template>
  <md-editor-text :text="formattedText"></md-editor-text>
</template>

<script>
  import editorMixin from './mixins/editor';

  export default {
    mixins: [editorMixin],
    props: {
      text: String,
      organization: Object
    },
    computed: {
      formattedText() {
        return this.linkMentions(this.text, (scheme, id) => {
          if (scheme === '@') {
            return this.getUrlPath({ user: id });
          }
          return undefined;
        });
      }
    }
  };
</script>