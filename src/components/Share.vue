<template>
  <span class="resource-share">
    <md-button class="md-icon-button" @click.native="$refs.dialog.open()">
      <md-icon>share</md-icon>
      <md-tooltip>{{$t('actions.share')}}</md-tooltip>
    </md-button>
    <md-dialog-alert
        :md-content="getAbsoluteUrl({type: type, id: id})"
        md-ok-text="OK"
        ref="dialog">
    </md-dialog-alert>
  </span>
</template>

<script>
  export default {
    props: {
      type: String,
      id: String
    }
  };
</script>