<template>
  <md-card class="card-form">
    <md-card-content>
      <slot :values="values" :errors="errors"></slot>
    </md-card-content>
    <md-card-actions v-if="!disabled">
      <slot name="buttons">
        <form-button action="save" class="md-primary"></form-button>
        <form-button action="reset"></form-button>
      </slot>
      <span style="flex: 1"></span>
      <slot name="secondaryButtons"></slot>
    </md-card-actions>
    <md-message :status="status" :progress="progress"></md-message>
    <form-unload-protect v-if="protectUnload"></form-unload-protect>
  </md-card>
</template>

<script>
  import Base from './Base';

  export default {
    extends: Base
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .card-form {
    .md-card-actions {
      padding-top: 0;
      margin-top: -16px;
    }
  }
</style>