<template>
  <md-button :md-menu-trigger="mdMenuTrigger" class="md-avatar-button">
    <md-avatar>
      <slot></slot>
    </md-avatar>
  </md-button>
</template>

<script>
  export default {
    props: {
      mdMenuTrigger: Boolean
    }
  };
</script>

<style lang="scss">
  .md-avatar-button {
    padding: 0;
    min-width: 0;
  }
</style>