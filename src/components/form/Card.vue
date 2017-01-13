<template>
  <md-card>
    <md-card-content>
      <slot :values="values" :errors="errors"></slot>
    </md-card-content>
    <md-card-actions>
      <slot name="buttons">
        <form-button action="save" class="md-primary"></form-button>
        <form-button action="reset"></form-button>
      </slot>
      <span style="flex: 1"></span>
      <slot name="secondaryButtons"></slot>
    </md-card-actions>
    <md-message :status="status" :progress="progress"></md-message>
  </md-card>
</template>

<script>
  import Base from './Base';

  export default {
    extends: Base
  };
</script>