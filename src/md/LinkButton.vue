<template>
  <router-link class="md-button" :to="to" :exact="exact" :append="append" :replace="replace" :disabled="disabled">
    <md-ink-ripple :md-disabled="disabled"></md-ink-ripple>
    <slot></slot>
  </router-link>
</template>

<script>
  export default {
    props: {
      disabled: Boolean,
      to: {
        type: [String, Object],
        required: true
      },
      exact: Boolean,
      append: Boolean,
      replace: Boolean,
    }
  };
</script>
