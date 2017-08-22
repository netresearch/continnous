<template>
  <div class="md-app" :class="{'md-app-search-focus': searchFocus || q}">
    <md-whiteframe md-elevation="2">
      <md-toolbar class="md-app-toolbar" :class="toolbarClass">
        <md-button v-if="isMobile" class="md-icon-button md-sidenav-trigger" @click.native="sidenavActive = true">
          <md-icon>menu</md-icon>
        </md-button>
        <slot name="title"></slot>
        <div v-if="search" @click="$refs.searchInput.focus()" class="md-app-search">
          <md-icon>search</md-icon>
          <input ref="searchInput" type="text" :value="q" :placeholder="search" @focus="searchFocus = true && $emit('search', $event.target.value)" @blur="searchFocus = false" @input="$emit('search', $event.target.value)">
          <md-icon @click.native.stop="$emit('search', false)">clear</md-icon>
        </div>
        <div style="flex: 1"></div>
        <md-button v-if="search" class="md-icon-button md-app-search-btn" @click.native="searchFocus = true; $timeOut(() => { $refs.searchInput.focus(); }, 100)" md-menu-trigger>
          <md-icon>search</md-icon>
        </md-button>
        <md-toolbar :class="['md-app-actions', {'md-app-actions-active': sidenavActive}]">
          <slot name="actions"></slot>
        </md-toolbar>
        <md-backdrop v-if="sidenavActive" @close="sidenavActive = false"></md-backdrop>
      </md-toolbar>
    </md-whiteframe>

    <div :class="['md-sidenav', 'md-left', {'md-active': sidenavActive}]">
      <div class="md-sidenav-content" @click="sidenavActive = false">
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
  import Current from '../models/Current';

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
      Current.app = this;

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
    }
    @media (max-width: $minWidth) {
      .md-app-search {
        position: absolute;
        left:-10px;
        top: -44px;
        width: 10px;
        overflow: hidden;
      }
    }
    &.md-app-search-focus {
      .md-app-search {
        background: #fff;
        color: rgba(#000, 0.6);
        box-shadow: 0 1px 1px rgba(0,0,0,0.24);
        border: 1px solid rgba(0,0,0,0.12);
      }
      @media (max-width: $minWidth) {
        .md-app-toolbar {
          > :not(.md-app-search) {
            display: none;
          }
          .md-app-search {
            position: relative;
            top: 0;
            left: 0;
            margin-left: 0;
            width: auto;
          }
        }
      }
    }
    @media (min-width: $minWidth) {
      .md-app-search-btn {
        display: none;
      }
    }
    .md-app-toolbar {
      flex-flow: row;
      .md-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .md-backdrop {
        opacity: 1;
        pointer-events: auto;
      }
      .md-app-actions {
        display: flex;
        flex-flow: row;
        align-content: center;
        align-items: center;
        @media (max-width: $minWidth) {
          position: absolute;
          z-index: 100;
          top: 0px;
          left: 0;
          flex-flow: row-reverse;
          justify-content: space-between;
          transform: translate3D(-100%, 0, 0);
          width: 304px;
          &.md-app-actions-active {
            transform: translate3D(0, 0, 0);
          }
        }
        @media (min-width: $minWidth) {
          background: transparent;
        }
      }
    }
    > .md-whiteframe {
      z-index: 2;
    }
    .md-sidenav {
      @media (min-width: $minWidth) {
        .md-app-mobile-toolbar {
          display: none;
        }
      }
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
        top: 64px;
        left: 0;
        right: 0;
        bottom: 0;
        > .md-sidenav-content {
          z-index: 100;
          top: 0;
          > .md-list:first-child {
            padding-top: 0;
          }
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