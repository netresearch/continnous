<template>
  <md-editor-text :text="formattedText"></md-editor-text>
</template>

<script>
  import Mentions from '../../../models/Mentions';

  export default {
    props: {
      text: String,
      organization: Object
    },
    computed: {
      formattedText() {
        return Mentions.linkMentions(this.text, (scheme, id) => {
          if (scheme === '@') {
            return this.getUrlPath({ user: id });
          }
          return undefined;
        });
      }
    }
  };
</script>