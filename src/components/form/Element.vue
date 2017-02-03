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
      naked: Boolean
    },
    mounted() {
      /* eslint-disable no-underscore-dangle */
      this.form._registerFormElement(this);
      /* eslint-enable no-underscore-dangle */
    },
    render(h) {
      const element = h(
        this.type,
        {
          on: {
            input: this.forwardEvent
          },
          props: Object.assign({}, this.$vnode.data.attrs,
            { value: this.form && this.name ? this.form.values[this.name] : undefined }),
          ref: 'el'
        },
        this.$slots.default
      );
      return h(
        'div',
        { class: 'form-element' },
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
</style>