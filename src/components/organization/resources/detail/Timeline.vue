<template>
  <div class="resource-detail-timeline">
    <journal :organization="organization" :item="item" no-resource reverse></journal>
  </div>
</template>

<script>
  import Journal from '../../Journal';

  export default {
    components: { Journal },
    props: {
      organization: Object,
      item: Object,
      type: String
    },
    data() {
      return {
        entries: []
      };
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-detail-timeline {
    .journal .md-layout {
      margin: 16px 0;
    }
  }
</style>