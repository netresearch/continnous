<template>
  <div>
    <md-dialog class="form-base-dialog" ref="dialog">
      <md-dialog-title>
        <form-element md-inline :label="titleLabel" name="title">
          <md-input></md-input>
        </form-element>
      </md-dialog-title>

      <md-dialog-content>
        <slot></slot>
      </md-dialog-content>

      <md-dialog-actions>
        <md-button @click="close">{{$t('actions.cancel')}}</md-button>
        <md-button class="md-primary">{{$t('actions.save')}}</md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
  import FormBase from '../../form/Base';

  export default {
    extends: FormBase,
    props: ['organization']
  };
</script>