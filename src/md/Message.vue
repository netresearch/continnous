<template>
  <div class="message-wrapper" :style="{display: toast || splash || !visible ? 'none' : 'block'}">
    <div class="message" v-show="visible">
      <template v-if="st === 0">
        <div class="loader" v-if="splash"></div>
        <md-spinner v-else md-indeterminate :md-size="32"></md-spinner>
      </template>
      <div class="message-content" v-else>
        <md-icon :class="st < 0 ? 'md-warn' : 'md-primary'">{{st === -1 ? 'error' : (st === -2 ? 'warning' : (st === 1 ? 'done' : 'info'))}}</md-icon>
        <div><slot>{{st < 0 ? $t('errors.general') : ''}}</slot></div>
      </div>
    </div>
  </div>
</template>

<script>
  let toastsElement;

  export default {
    props: {
      splash: Boolean, // Not supported to be changed by now
      toast: Boolean, // Not supported to be changed by now
      status: {
        type: Number,
        default: NaN
      },
      timeout: {
        type: Number,
        default: 1500
      }
    },
    data() {
      return {
        visible: false,
        st: this.status
      };
    },
    watch: {
      status: {
        immediate: true,
        handler(status) {
          this.visible = !isNaN(status);
          this.st = status;
          if (status !== 0 && !isNaN(status) && this.timeout > 0) {
            /* global window */
            window.setTimeout(() => {
              if (this.status !== 0 && !isNaN(this.status)) {
                this.close();
              }
            }, this.timeout);
          }
        }
      }
    },
    mounted() {
      this.$nextTick(() => {
        /* global document */
        if (this.splash) {
          this.splashElement = document.createElement('div');
          this.splashElement.className = 'splash';
          this.$root.$el.appendChild(this.splashElement);
        } else if (this.toast && !toastsElement) {
          toastsElement = document.createElement('div');
          toastsElement.className = 'toasts';
        }
        this.element = this.$el.childNodes[0];
        if (this.toast || this.splash) {
          (this.splash ? this.splashElement : toastsElement).appendChild(this.element);
        }
      });
    },
    beforeDestroy() {
      this.close();
    },
    methods: {
      close() {
        if (this.toast || this.splash) {
          if (this.element) {
            this.$el.appendChild(this.element);
            this.element = null;
          }
          if (this.splashElement) {
            this.splashElement.parentNode.removeChild(this.splashElement);
          }
        }
        this.visible = false;
        this.st = NaN;
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
  .message-wrapper {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: rgba(250, 250, 250, 0.8);
    z-index: 100;
    .md-spinner, .message {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      .message-content > div {
        padding-top: 10px;
      }
    }
  }
</style>