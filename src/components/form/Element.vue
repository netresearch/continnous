<script>
  import Child from './child';

  export default {
    extends: Child,
    components: {},
    props: {
      type: { type: String, required: true },
      name: { type: String, required: true },
      label: String,
      mdInline: Boolean,
      mdHasPassword: Boolean,
      naked: Boolean,
      disabled: Boolean,
      /*
       'method'
       'method1,method2'
       function(value) {}
       ['method', function(value) {}]
       {method1: true, method2: {length: 2}}
      */
      validate: [String, Function, Array, Object],
      filter: [String, Function, Array, Object],
    },
    data() {
      return {
        defaultElementArgs: {}
      };
    },
    mounted() {
      /* eslint-disable no-underscore-dangle */
      this.form._registerFormElement(this);
      if (['md-input', 'md-textarea', 'md-editor'].indexOf(this.type) > -1) {
        this.$refs.el.parentContainer = this.$refs.container;
      }
      if (this.type === 'form-file') {
        this.$refs.el.$refs.mdFile.$refs.textInput.parentContainer = this.$refs.container;
      }
      /* eslint-enable no-underscore-dangle */
    },
    beforeDestroy() {
      /* eslint-disable no-underscore-dangle */
      this.form._unregisterFormElement(this);
      /* eslint-enable no-underscore-dangle */
    },
    render(h) {
      const disabled = this.disabled || (this.form && this.form.disabled);
      const value = this.form && this.name ? this.form.values[this.name] : undefined;
      const hasValue = value
        && this.form.values.hasOwnProperty(this.name)
        && (value.hasOwnProperty('pop') ? value.length : Boolean(value));
      const element = h(
        this.type,
        {
          on: {
            input: this.forwardEvent
          },
          props: Object.assign({}, this.defaultElementArgs, this.$vnode.data.attrs, {
            value,
            disabled,
            required: this.isRequired()
          }),
          ref: 'el'
        },
        this.$slots.default
      );
      // this.$vnode.data.attrs = {};
      return h(
        'div',
        {
          style: disabled && !hasValue ? { display: 'none' } : {},
          class: [
            'form-element',
            'form-element-' + this.name,
            {
              'form-element-disabled': disabled,
              'form-element-has-value': hasValue
            }
          ],
          attrs: {}
        },
        [
          this.naked ? element : h(
            'md-input-container',
            {
              props: {
                mdInline: this.mdInline || (this.form && this.form.mdInline),
                mdHasPassword: this.mdHasPassword
              },
              class: {
                'md-input-invalid': this.form && this.name && this.form.errors.hasOwnProperty(this.name),
              },
              ref: 'container'
            },
            this.label ? [h('label', this.label), element] : [element]
          )
        ]
      );
    },
    methods: {
      forwardEvent(value) {
        this.$emit('input', value);
        this.$emit('change', value);
        this.form.onChange(this.name, value);
      },
      isRequired() {
        if (typeof this.validate === 'string') {
          return this.validate.split(',').indexOf('required') > -1;
        } else if (Array.isArray(this.validate)) {
          return this.validate.indexOf('required') > -1;
        } else if (typeof this.validate === 'object') {
          return this.validate.hasOwnProperty('required');
        }
        return false;
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .form-element {
    .md-input-container:not(.md-input-inline) label,
    .md-input-container.md-input-inline.md-input-focused label,
    .md-input-container.md-input-inline:hover label {
      pointer-events: auto;
      top: 0;
      opacity: 1;
      font-size: 12px;
    }
  }
  .md-input-container.md-has-select:not(.md-has-value) .md-select-value {
    color: rgba(#000, 0.54);
  }
</style>