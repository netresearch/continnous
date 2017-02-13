<template>
  <div>
    <div ref="inner">
      <div
          class="elastic-list-more"
          :style="{height: moreHeight + 'px'}"
          ref="more"
      ><md-icon class="md-small" @click.native="expand()">more_horiz</md-icon></div>
      <slot></slot>
    </div>
  </div>
</template>

<script>
  import MutationObserver from 'mutation-observer';

  export default {
    props: {
      containerSelector: String,
      itemSelector: {
        type: String,
        required: true
      },
      moreHeight: {
        type: Number,
        default: 12
      }
    },
    watch: {
      $route() {
        this.expanded = false;
      }
    },
    mounted() {
      this.observer = new MutationObserver(this.update);
      this.observer.observe(this.$parent.$el, {
        attributes: true,
        childList: true,
        subtree: true
      });
      /* global window */
      window.addEventListener('resize', this.update);
    },
    beforeDestroy() {
      if (this.observer) {
        this.observer.disconnect();
      }
    },
    methods: {
      reset() {
        this.expanded = false;
        this.update();
      },
      expand() {
        this.expanded = true;

        const inner = this.$refs.inner;
        const selectors = [this.itemSelector];
        if (this.containerSelector) {
          selectors.unshift(this.containerSelector);
        }
        inner.querySelectorAll(selectors.join(', ')).forEach((el) => {
          el.classList.remove('elastic-list-hidden');
        });
        this.$refs.more.classList.remove('elastic-list-more-active');
      },
      update() {
        /* global document */
        if (this.inProgress || this.expanded) {
          return;
        }
        this.inProgress = true;

        const inner = this.$refs.inner;
        const more = this.$refs.more;
        const items = [];
        if (this.containerSelector) {
          inner.querySelectorAll(this.containerSelector).forEach((containerEl) => {
            const container = { el: containerEl, children: 0 };
            containerEl.classList.remove('elastic-list-hidden');
            containerEl.querySelectorAll(this.itemSelector).forEach((el) => {
              container.children++;
              items.push({ el, container });
              el.classList.remove('elastic-list-hidden');
            });
          });
        } else {
          inner.querySelectorAll(this.itemSelector).forEach((el) => {
            items.push({ el });
            el.classList.remove('elastic-list-hidden');
          });
        }
        more.classList.remove('elastic-list-more-active');

        let itemRemoved = false;
        let availableHeight = this.$el.getBoundingClientRect().height;

        const removeNextItem = () => {
          this.$nextTick(() => {
            if (items.length && inner.getBoundingClientRect().height > availableHeight) {
              const item = items.shift();
              item.el.classList.add('elastic-list-hidden');
              if (item.container) {
                item.container.children--;
                if (!item.container.children) {
                  item.container.el.classList.add('elastic-list-hidden');
                }
              }
              if (!itemRemoved) {
                more.classList.add('elastic-list-more-active');
                availableHeight -= this.moreHeight;
                itemRemoved = true;
              }
              removeNextItem();
            } else {
              this.inProgress = false;
            }
          });
        };
        removeNextItem();
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .elastic-list-more {
    text-align: center;
    width: 100%;
    display: none;
    .md-icon {
      cursor: pointer;
      &:hover {
        color: inherit;
      }
    }
    &.elastic-list-more-active {
      display: block;
    }
  }
  .elastic-list-hidden {
    display: none;
  }
</style>