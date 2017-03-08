<template>
  <div class="scroll-container">
    <template v-if="auth.user">
      <md-toolbar class="md-dense">
        <h2 class="md-title">{{$t('settings')}}</h2>
      </md-toolbar>

      <md-toolbar class="md-dense md-nav-bar">
        <router-link
            exact
            v-for="(name, path) in {'': $t('general'), 'permissions': $tc('permission', 2), 'users': $tc('user', 2)}"
            :to="getUrlPath({settings: path || true})" class="md-button">
          {{name}}
        </router-link>
      </md-toolbar>

      <router-view :organization="organization" class="scroll-content"></router-view>
    </template>
  </div>
</template>

<script>
  import auth from '../../auth';

  export default {
    props: ['organization'],
    data() {
      return { auth };
    }
  };
</script>