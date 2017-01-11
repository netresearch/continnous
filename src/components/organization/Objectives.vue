<template>
  <div>
    <md-toolbar class="md-dense">
      <h2 class="md-title">{{$tc('objective', 2)}}</h2>
    </md-toolbar>

    <router-view :organization="organization"></router-view>

    <h3>Objectives</h3>
  </div>
</template>

<script>
  export default {
    props: ['organization']
  };
</script>