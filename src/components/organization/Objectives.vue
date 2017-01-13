<template>
  <resource-page type="objectives" :organization="organization" :permissions="permissions">

  </resource-page>
</template>

<script>
  import ResourcePage from './resources/Page';

  export default {
    props: ['organization', 'permissions'],
    components: { ResourcePage }
  };
</script>