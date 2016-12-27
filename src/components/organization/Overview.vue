<template>
  <md-toolbar class="md-dense">
    <h2 class="md-title">{{$t('overview')}}</h2>
  </md-toolbar>
</template>

<script>
  export default {
    props: {
      organization: Object
    }
  };
</script>