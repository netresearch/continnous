<template>
  <div>
    <domains :organization="organization"></domains>
    <permissions :organization="organization"></permissions>
  </div>
</template>

<script>
  import Domains from './security/Domains';
  import Permissions from './security/Permissions';

  export default {
    props: ['organization'],
    components: {
      Domains,
      Permissions
    }
  };
</script>