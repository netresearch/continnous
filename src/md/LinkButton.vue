<template>
  <md-button class="md-primary md-link-button"><slot></slot></md-button>
</template>

<script>
  export default {
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .md-link-button {
    padding: 0;
    min-width: 0;
    min-height: 0;
    margin: 0;
    &:hover {
     background: transparent !important;
     text-decoration: underline !important;
   }
  }
</style>
