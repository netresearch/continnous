<script>
  import Child from './child';

  export default {
    extends: Child,
    props: {
      type: { type: String, required: true },
      name: { type: String, required: true },
      label: String,
      mdInline: Boolean,
      mdHasPassword: Boolean,
      naked: Boolean,
      disabled: Boolean
    },
    mounted() {
      /* eslint-disable no-underscore-dangle */
      this.form._registerFormElement(this);
      /* eslint-enable no-underscore-dangle */
      if (this.type === 'md-textarea') {
        this.$nextTick(() => {
          /* global document, window */
          const evt = document.createEvent('Event');
          evt.initEvent('autosize:update', true, false);
          window.setTimeout(() => {
            if (this.$refs.el) {
              this.$refs.el.$el.dispatchEvent(evt);
            }
          }, 1000);
        });
      }
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
          props: Object.assign({}, this.$vnode.data.attrs, {
            value,
            disabled
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
              }
            },
            this.label ? [h('label', this.label), element] : [element]
          )
        ]
      );
    },
    methods: {
      forwardEvent(value) {
        this.form.onChange(this.name, value);
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