<template>
  <elastic-list class="resource-detail-timeline" container-selector=".journal-group" item-selector=".journal-entry">
    <journal :organization="organization" :item="item" no-resource reverse></journal>
  </elastic-list>
</template>

<script>
  import Journal from '../../Journal';
  import ElasticList from '../../../ElasticList';

  export default {
    components: { Journal, ElasticList },
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

    .elastic-list-more {
      .md-icon {
        margin: -12px auto 0;
        color: rgba(#000, 0.54);
      }
    }
  }
</style>