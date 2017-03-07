<template>
  <div>
    <md-dialog class="form-dialog" ref="dialog" @close="onClosed()">
      <md-dialog-title>
        <slot name="title" :values="values" :errors="errors"></slot>
      </md-dialog-title>
      <md-dialog-content>
        <slot :values="values" :errors="errors"></slot>
      </md-dialog-content>
      <md-dialog-actions>
        <slot name="leftButtons">

        </slot>
        <form-button action="reset"></form-button>
        <slot name="centerButtons">
          <span style="flex: 1"></span>
        </slot>
        <md-button @click.native="$refs.dialog.close()">{{$t('actions.cancel')}}</md-button>
        <form-button action="save" class="md-primary md-raised"></form-button>
      </md-dialog-actions>
      <md-message :status="status" :progress="progress"></md-message>
      <form-unload-protect v-if="protectUnload"></form-unload-protect>
    </md-dialog>
  </div>
</template>

<script>
  import Base from './Base';

  export default {
    extends: Base,
    data() {
      return {
        saved: undefined
      };
    },
    created() {
      this.$on('saved', (saved) => {
        this.saved = saved;
        this.$refs.dialog.close();
      });
    },
    mounted() {
      this.$nextTick(() => {
        this.$refs.dialog.open();
      });
    },
    beforeDestroy() {
      this.$refs.dialog.close();
    },
    methods: {
      onClosed() {
        this.$nextTick(() => {
          this.$emit('closed', this.saved);
        });
      },
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .form-dialog {
    .md-dialog-title .md-input-container {
      margin:0;
      margin-top: -16px;
    }
  }
</style>