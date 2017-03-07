<template>
  <div class="md-app">
    <md-whiteframe md-elevation="2">
      <md-toolbar :class="toolbarClass">
        <md-button v-if="isMobile" class="md-icon-button md-sidenav-trigger" @click.native="sidenavActive = true">
          <md-icon>menu</md-icon>
        </md-button>
        <slot name="title"></slot>
        <div v-if="search" @click="$refs.searchInput.focus()" :class="{'md-app-search': true, 'md-app-search-focus': searchFocus || q}">
          <md-icon>search</md-icon>
          <input ref="searchInput" type="text" :value="q" :placeholder="search" @focus="searchFocus = true && $emit('search', $event.target.value)" @blur="searchFocus = false" @input="$emit('search', $event.target.value)">
          <md-icon @click.native.stop="$emit('search', false)">clear</md-icon>
        </div>
        <div style="flex: 1"></div>
        <slot name="actions"></slot>
      </md-toolbar>
    </md-whiteframe>

    <div :class="['md-sidenav', 'md-left', {'md-active': sidenavActive}]">
      <div class="md-sidenav-content">
        <slot name="sidebar"></slot>
      </div>
      <md-backdrop v-if="sidenavActive" class="md-sidenav-backdrop" @close="sidenavActive = false"></md-backdrop>
    </div>

    <div class="md-app-content" :class="contentClass">
      <slot></slot>
    </div>
  </div>
</template>

<script>
  const minWidth = 928; // See SCSS variable below as well

  export default {
    props: {
      toolbarClass: [String, Object, Array],
      contentClass: [String, Object, Array],
      search: String,
      q: String
    },
    data() {
      /* global window */
      return {
        sidenavActive: false,
        isMobile: window.innerWidth < minWidth,
        searchFocus: false
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
    .md-app-search {
      background: rgba(#fff, 0.3);
      border-radius: 3px;
      height: 44px;
      margin-left: 24px;
      display: flex;
      flex-flow: row;
      flex: 1;
      transition: background 100ms ease-in,width 100ms ease-out;
      cursor: pointer;
      .md-icon {
        margin-left: 16px;
        margin-right: 16px;
      }
      input {
        flex: 1;
        background: transparent;
        border: none;
        font-size: inherit;
        cursor: text;
        &:focus {
          border:none;
          outline: none;
        }
        color: inherit !important;
        &::-webkit-input-placeholder {
          color: inherit !important;
        }
        &:-moz-placeholder {
          color: inherit !important;
        }
        &::-moz-placeholder {
          color: inherit !important;
        }
        &:-ms-input-placeholder {
          color: inherit !important;
        }
      }
      &.md-app-search-focus {
        background: #fff;
        color: rgba(#000, 0.6);
        box-shadow: 0 1px 1px rgba(0,0,0,0.24);
        border: 1px solid rgba(0,0,0,0.12);
      }
    }
    > .md-whiteframe {
      z-index: 2;
    }
    .md-sidenav {
      > .md-sidenav-content {
        top: 64px - 8;
        z-index: 1;
        @media (min-width: $minWidth) {
          transform: translate3D(0, 0, 0);
          box-shadow: 0 8px 10px -5px rgba(0, 0, 0, 0.2), 0 6px 5px 1px rgba(0, 0, 0, 0.1);
          pointer-events: auto;
        }
      }
      &.md-active {
        position: absolute;
        z-index: 3;
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
        margin-left: 304px;
      }
    }
  }
</style>