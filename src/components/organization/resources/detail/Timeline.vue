<template>
  <div class="resource-detail-timeline">
    <journal :organization="organization" :entries="entries" no-resource></journal>
  </div>
</template>

<script>
  import sortBy from 'sort-by';
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
    },
    watch: {
      'item.id': {
        immediate: true,
        handler(id) {
          this.entries = [];
          this.organization.journal.getRef().orderByChild('id').equalTo(id).on('value', (sn) => {
            sn.forEach((csn) => {
              this.entries.push(csn.val());
            });
            this.entries.sort(sortBy('time'));
          });
        }
      }
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