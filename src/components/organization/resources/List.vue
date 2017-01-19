<template>
  <div :class="['resources-list', 'resources-list-' + (masonry ? 'masonry' : 'stream')]">
    <div class="resources-list-width"></div>
    <div :class="['resources-list-item', 'item-' + item.id]" v-for="item in items">
      <slot :item="item"></slot>
    </div>
  </div>
</template>

<script>
  import Masonry from 'masonry-layout';

  export default {
    props: {
      items: [Array, Object],
      masonry: Boolean,
    },
    data() {
      return {
        mounted: false
      };
    },
    mounted() {
      this.mounted = true;
      this.updateMasonry();
    },
    beforeDestroy() {
      this.mounted = false;
      this.updateMasonry();
    },
    watch: {
      masonry() {
        this.$nextTick(this.updateMasonry);
      },
      items: {
        deep: true,
        handler() {
          this.$nextTick(() => {
            if (this.msnry) {
              this.msnry.reloadItems();
              this.msnry.layout();
            }
          });
        }
      }
    },
    methods: {
      updateMasonry() {
        if ((!this.masonry || !this.mounted) && this.msnry) {
          this.msnry.destroy();
          delete this.msnry;
        } else if (this.masonry && !this.msnry && this.mounted) {
          this.msnry = new Masonry(this.$el, {
            itemSelector: '.resources-list-item',
            columnWidth: '.resources-list-width',
            percentPosition: true,
          });
          this.msnry.layout();
        }
      }
    }
  };
</script>


<style lang="scss" rel="stylesheet/scss">
  .resources-list-stream {
    .resources-list-item {
      margin: 32px auto 0;
      width: 100%;
      max-width: 500px;
    }
  }
  .resources-list-masonry {
    margin: 0 -8px;
    .resources-list-item {
      display: block;
      > .md-card {
        margin: 0 8px 16px;
      }
    }
    .resources-list-item,
    .resources-list-width {
      width: 100%;
      @media (min-width: 600px) {
        width: 50%;
      }
      @media (min-width: 1300px) {
        width: 33.333%;
      }
      @media (min-width: 1300px) {
        width: 25%;
      }
      @media (min-width: 1600px) {
        width: 20%;
      }
    }
  }
</style>