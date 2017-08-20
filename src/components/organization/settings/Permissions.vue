<template>
  <div>
    <domains></domains>
    <permissions></permissions>
  </div>
</template>

<script>
  import Domains from './security/Domains';
  import Permissions from './security/Permissions';

  export default {
    components: {
      Domains,
      Permissions
    }
  };
</script>