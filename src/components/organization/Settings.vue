<template>
  <div class="scroll-container">
    <template v-if="Current.user">
      <md-toolbar class="md-dense">
        <h2 class="md-title">{{$t('settings.title')}}</h2>
      </md-toolbar>

      <md-toolbar class="md-dense md-nav-bar">
        <router-link
            exact
            v-for="(name, path) in {'': $t('general'), 'permissions': $tc('permission', 2), 'users': $tc('user', 2), 'connections': $tc('connections.title', 2)}"
            :to="getUrlPath({settings: path || true})" class="md-button">
          {{name}}
        </router-link>
      </md-toolbar>

      <router-view class="scroll-content"></router-view>
    </template>
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