<template>
  <div class="resource-detail-tags">
    <router-link v-for="tag in item.tags" :to="{path: getUrlPath({search: true, type: null}), query: { q: 'tags.keyword:' + tag}}">
      <md-chip>{{tag}}</md-chip>
    </router-link>
  </div>
</template>

<script>
  export default {
    props: ['organization', 'type', 'item']
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-detail-tags {
    > a {
      margin-right: 6px;
      color: inherit !important;
      &:last-of-type {
        margin-right: 0;
      }
      .md-chip {
        cursor: pointer;
      }
      &:hover {
        .md-chip {
          border-color: rgba(#000, 0.24);
        }
      }
    }
  }
</style>