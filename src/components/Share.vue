<template>
  <span class="resource-share">
    <md-button class="md-icon-button" @click="$refs.dialog.open()">
      <md-icon>share</md-icon>
      <md-tooltip>{{$t('actions.share')}}</md-tooltip>
    </md-button>
    <md-dialog-alert
        :md-content="url"
        md-ok-text="OK"
        ref="dialog">
    </md-dialog-alert>
  </span>
</template>

<script>
  export default {
    props: {
      url: String
    }
  };
</script>