<template>
  <div class="resource-detail-content">
    <template v-if="item">
      <h2>{{item.title}}</h2>
      <p class="resource-detail-subtitle" v-if="item.subtitle">{{item.subtitle}}</p>
      <resource-image :image="item.image"></resource-image>
      <div class="resource-detail-description" v-if="item.description">{{item.description}}</div>
    </template>
  </div>
</template>

<script>
  import ResourceImage from '../Image';

  export default {
    components: { ResourceImage },
    props: {
      type: String,
      item: Object
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-detail-content h2 {
    font-weight: 400;
    margin-top: 0;
    line-height: 1;
  }
  .resource-detail-subtitle {
    color: rgba(#000, 0.56);
  }
</style>