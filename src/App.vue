<template>
  <div id="app">
    <md-toolbar>
      <h2 class="md-title" style="flex: 1">Default</h2>
      <auth v-model="user"></auth>
    </md-toolbar>
    <template v-if="user">
      <h1>Hi {{user.displayName}}</h1>
      You're member of following organizations:
      <ul>
        <li v-for="organization in user.organizations">
          {{organization.name}} ({{organization.uid}})
        </li>
      </ul>
    </template>
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
  data() {
    return {
      user: null,
    };
  },
};
</script>

<style>
</style>
