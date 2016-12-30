<template>
  <div>
    <md-toolbar class="md-dense">
      <h2 class="md-title">{{$t('settings')}}</h2>
    </md-toolbar>

    <md-toolbar class="md-dense md-nav-bar">
      <router-link
          exact
          v-for="(name, path) in {'': $t('general'), '/permissions': $tc('permission', 2), '/users': $tc('user', 2)}"
          :to="'/' + organization.key + '/settings' + path" class="md-button">
        {{name}}
      </router-link>
    </md-toolbar>

    <router-view :organization="organization"></router-view>
  </div>
</template>

<script>
  export default {
    props: ['organization']
  };
</script>