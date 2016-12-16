<template>
  <div id="app" v-md-theme="'default'">
    <md-toolbar>
      <h2 class="md-title" style="flex: 1">Default</h2>
      <auth></auth>
    </md-toolbar>
    <img src="./assets/logo.png">
  </div>
</template>

<script>
import Auth from './components/Auth';

export default {
  name: 'app',
  components: {
    Auth,
  },
};
</script>

<style>
</style>
