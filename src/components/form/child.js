export const findParentForm = (vm) => {
  let parent = vm;
  /* eslint-disable no-underscore-dangle */
  while (parent && parent._uid !== 0) {
    if (typeof parent._registerFormElement === 'function') {
      break;
    }
    parent = parent.$parent;
  }
  /* eslint-enable no-underscore-dangle */
  if (!parent) {
    throw new Error('No parent form found');
  }
  return parent;
};

export default {
  data() {
    return {
      form: undefined
    };
  },
  mounted() {
    this.form = findParentForm(this.$parent);
  }
};
