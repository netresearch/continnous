<template>
  <div class="resource-detail-content">
    <template v-if="item">
      <h2>{{item.title}}</h2>
      <p class="resource-detail-subtitle" v-if="item.subtitle">{{item.subtitle}}</p>
      <resource-image :image="item.image"></resource-image>
      <editor-text class="resource-detail-description" v-if="item.description" :text="item.description"></editor-text>
    </template>
    
    <slot></slot>
  </div>
</template>

<script>
  import ResourceImage from '../Image';
  import EditorText from '../../common/EditorText';

  export default {
    components: { ResourceImage, EditorText },
    props: {
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
  .resource-detail-description {
    margin: 1em 0;
  }
</style>