<script>
export default {
  name: 'app',
  data() {
    return {
      user: null,
      organization: null,
      errors: []
    };
  }
};
</script>

<template>
  <div id="app">
    <router-view></router-view>

    <md-message error v-if="errors.length > 0">
      {{$t('errors.' + errors[errors.length - 1].message, errors[errors.length - 1])}}
    </md-message>
  </div>
</template>