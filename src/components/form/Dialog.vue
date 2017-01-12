<template>
  <div>
    <md-dialog class="form-dialog" ref="dialog">
      <md-dialog-title>
        <slot name="title" :values="values" :errors="errors"></slot>
      </md-dialog-title>
      <md-dialog-content>
        <slot :values="values" :errors="errors"></slot>
      </md-dialog-content>
      <md-dialog-actions>
        <form-button action="reset"></form-button>
        <span style="flex: 1"></span>
        <md-button @click="close()">{{$t('actions.cancel')}}</md-button>
        <form-button action="save" class="md-primary md-raised"></form-button>
      </md-dialog-actions>
      <md-message :status="status"></md-message>
    </md-dialog>
  </div>
</template>

<script>
  import Base from './Base';

  console.log(Base);

  export default {
    extends: Base,
    mounted() {
      this.$nextTick(() => {
        this.$refs.dialog.open();
      });
    },
    methods: {
      close() {
        this.$refs.dialog.close();
        this.$nextTick(() => {
          this.$router.back();
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