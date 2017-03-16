export default function install(Vue) {
  const MdDialog = Vue.component('md-dialog').options;
  MdDialog.props.mdOpen = Boolean;
  if (!MdDialog.watch) {
    MdDialog.watch = {};
  }
  /* eslint-disable func-names */
  MdDialog.watch.mdOpen = function (mdOpen) {
    if (this.mounted && mdOpen !== this.active) {
      this[mdOpen ? 'open' : 'close']();
    }
  };
  MdDialog.mounted.push(function () {
    this.mounted = true;
    this.$nextTick(() => {
      if (this.mdOpen) {
        this.open();
      }
    });
  });
  MdDialog.beforeDestroy.unshift(function () {
    this.mounted = false;
  });
}
