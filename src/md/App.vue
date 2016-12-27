<template>
  <div class="md-app">
    <md-whiteframe md-elevation="3">
      <md-toolbar :class="toolbarClass">
        <md-button v-if="isMobile" class="md-icon-button md-sidenav-trigger" @click="sidenavActive = true">
          <md-icon>menu</md-icon>
        </md-button>
        <slot name="toolbar"></slot>
      </md-toolbar>
    </md-whiteframe>

    <div :class="['md-sidenav', 'md-left', {'md-active': sidenavActive}]">
      <div class="md-sidenav-content">
        <slot name="sidebar"></slot>
      </div>
      <md-backdrop v-if="sidenavActive" class="md-sidenav-backdrop" @close="sidenavActive = false"></md-backdrop>
    </div>

    <div class="md-app-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
  const minWidth = 928; // See SCSS variable below as well

  export default {
    props: {
      toolbarClass: [String, Object, Array]
    },
    data() {
      /* global window */
      return {
        sidenavActive: false,
        isMobile: window.innerWidth < minWidth
      };
    },
    created() {
      /* global window */
      window.addEventListener('resize', () => {
        this.isMobile = window.innerWidth < minWidth;
        if (!this.isMobile) {
          this.sidenavActive = false;
        }
      });
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  $minWidth: 928px;
  .md-app {
    .md-sidenav {
      > .md-sidenav-content {
        top: 64px - 8;
        z-index: 0;
        @media (min-width: $minWidth) {
          transform: translate3D(0, 0, 0);
          box-shadow: 0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 16px 24px 2px rgba(0, 0, 0, 0.14), 0 6px 30px 5px rgba(0, 0, 0, 0.12);
          pointer-events: auto;
        }
      }
      &.md-active {
        position: absolute;
        z-index: 2;
        top: -64px;
        left: 0;
        right: 0;
        bottom: 0;
        > .md-sidenav-content {
          z-index: 100;
        }
        @media (min-width: $minWidth) {
          position: static;
          > .md-sidenav-content {
            z-index: 0;
          }
        }
      }
    }
    .md-app-content {
      margin-left: 0;
      transition: margin-left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      @media (min-width: $minWidth) {
        margin-left: 304px + 16;
      }
    }
  }
</style>