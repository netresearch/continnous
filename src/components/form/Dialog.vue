<template>
  <div>
    <md-dialog class="form-base-dialog" ref="dialog">
      <slot></slot>
    </md-dialog>
  </div>
</template>

<script>
  export default {
    mounted() {
      this.$nextTick(() => {
        this.$refs.dialog.open();
      });
    },
    close() {
      this.$refs.dialog.close();
      this.$nextTick(() => {
        this.$router.back();
      });
    },
  };
</script>