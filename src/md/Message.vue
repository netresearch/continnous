<template>
  <div class="message-wrapper" style="display: none">
    <div class="message">
      <div class="loader" v-if="loading"></div>
      <div class="message-content" v-else>
        <md-icon :class="{'md-warn': error || warning}">{{error ? 'error' : (warning ? 'warning' : 'info')}}</md-icon>
        <div><slot></slot></div>
      </div>
    </div>
  </div>
</template>

<script>
  let toastsElement;

  export default {
    props: {
      error: Boolean,
      warning: Boolean,
      loading: Boolean,
      splash: Boolean // Not supported to be changed by now
    },
    mounted() {
      this.$nextTick(() => {
        /* global document */
        if (this.splash) {
          this.splashElement = document.createElement('div');
          this.splashElement.className = 'splash';
          this.$root.$el.appendChild(this.splashElement);
        } else if (!toastsElement) {
          toastsElement = document.createElement('div');
          toastsElement.className = 'toasts';
        }
        this.element = this.$el.childNodes[0];
        (this.splash ? this.splashElement : toastsElement).appendChild(this.element);
      });
    },
    beforeDestroy() {
      this.element.parentNode.removeChild(this.element);
      if (this.splash) {
        this.splashElement.parentNode.removeChild(this.splashElement);
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  // See index.html for the rest of the styles
  // they are required there for the preloader
  .message-content {
    position: relative;
    > .md-icon {
      position: absolute;
      left: 0;
      top: 8px;
    }
    > div {
      padding-left: 32px;
      max-width: 200px;
    }
  }
  .splash > .message > .message-content {
    padding-top: 10px;
    border-top: 2px solid #ddd;
  }
</style>