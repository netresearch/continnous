<template>
  <div class="resource-image" v-show="image">
    <div :style="{paddingTop: (image.height / image.width * 100) + '%'}"></div>
    <md-image :md-src="image.preview"></md-image>
  </div>
</template>

<script>
  export default {
    props: {
      image: Object
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-image {
    position: relative;
    background: #eeeeee;
    > div {
      padding-top: 100%;
    }
    img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }
</style>