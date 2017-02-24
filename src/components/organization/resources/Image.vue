<template>
  <div class="resource-image" v-show="image">
    <div v-if="image" :style="{paddingTop: (image.height / image.width * 100) + '%'}"></div>
    <md-image v-if="image && (preview || image.preview)" :md-src="preview || image.preview"></md-image>
  </div>
</template>

<script>
  import File from '../../../models/File';

  export default {
    props: {
      image: Object
    },
    data() {
      return { preview: undefined };
    },
    watch: {
      image: {
        immediate: true,
        handler(image) {
          if (image && !image.hasOwnProperty('preview')) {
            File.getPreviewURL(image, (src) => {
              this.preview = src;
            });
          } else {
            this.preview = undefined;
          }
          if (image) {
            this.$nextTick(() => {
              this.$nextTick(() => {
                this.$emit('resource-image-shown');
              });
            });
          }
        }
      }
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