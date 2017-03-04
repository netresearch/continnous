<template>
  <div class="md-editor-text">
    <div class="ql-editor" v-if="text" v-html="text"></div>
  </div>
</template>

<script>
  export default {
    props: {
      text: String
    }
  };
</script>

<style>
  .md-editor-text .ql-editor {
    padding: 0;
  }
</style>