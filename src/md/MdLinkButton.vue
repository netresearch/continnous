<template>
  <router-link
      class="md-button"
      :class="[themeClass]"
      :to="to"
      :exact="exact"
      :append="append"
      :replace="replace"
      :disabled="disabled"
      :active-class="activeClass"
  >
    <md-ink-ripple :md-disabled="disabled"></md-ink-ripple>
    <slot></slot>
  </router-link>
</template>

<script>
  import Vue from 'vue';

  export default {
    extends: Vue.component('md-button').options,
    props: {
      to: {
        type: [String, Object],
        required: true
      },
      exact: Boolean,
      append: Boolean,
      replace: Boolean,
      activeClass: String
    }
  };
</script>
