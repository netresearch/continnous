<script>
export default {
  name: 'app',
  data() {
    return {
      user: null,
      organization: null,
      errors: [],
      mouse: false
    };
  },
  mounted() {
    /* global document */
    const moveListener = () => {
      this.mouse = true;
      document.body.removeEventListener('mousemove', moveListener);
    };
    document.body.addEventListener('mousemove', moveListener);
  }
};
</script>

<template>
  <div id="app" :class="{'has-mouse': mouse}">
    <router-view></router-view>

    <md-message error v-if="errors.length > 0">
      {{$t('errors.' + errors[errors.length - 1].message, errors[errors.length - 1])}}
    </md-message>
  </div>
</template>