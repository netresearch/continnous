<template>
  <div class="scroll-container">
    <div class="scroll-content" v-if="Current.user">
      <md-toolbar class="md-dense md-transparent md-nav-bar">
        <router-link
            exact
            v-for="(name, path) in {'': $t('general'), 'permissions': $tc('permission', 2), 'users': $tc('user', 2), 'connections': $tc('connections.title', 2)}"
            :to="getUrlPath({settings: path || true})" class="md-button">
          {{name}}
        </router-link>
      </md-toolbar>

      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  import Current from '../../models/Current';

  export default {
    data() {
      return { Current };
    }
  };
</script>