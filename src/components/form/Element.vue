<template>
  <div class="form-element">
    <md-input-container
        v-if="!naked"
        ref="inputContainer"
        :md-inline="mdInline"
        :md-has-password="mdHasPassword"
        :class="{'md-input-invalid': name && form && form.errors[name]}"
    >
      <label v-if="label">{{label}}</label>
      <slot></slot>
    </md-input-container>
    <template v-else>
      <slot></slot>
    </template>
  </div>
</template>

<script>
  import Child from './child';

  export default {
    extends: Child,
    props: {
      name: String,
      label: String,
      mdInline: Boolean,
      mdHasPassword: Boolean,
      naked: Boolean
    },
    data() {
      return { input: undefined };
    },
    mounted() {
      this.$nextTick(() => {
        (this.naked ? this : this.$refs.inputContainer).$children.forEach((child) => {
          if (child.hasOwnProperty('value')) {
            if (this.input) {
              throw new Error('Form element may contain exactly one input child');
            }
            this.input = child;
          }
        });
        if (!this.input) {
          throw new Error('Form element must contain exactly one input child');
        }
        this.input.$on('input', this.forwardEvent.bind(this, 'input'));
        this.input.$on('change', this.forwardEvent.bind(this, 'change'));

        /* eslint-disable no-underscore-dangle */
        this.form._registerFormElement(this);
        /* eslint-enable no-underscore-dangle */
      });
    },
    methods: {
      forwardEvent(...args) {
        const event = args.shift();
        if (this.name) {
          args.unshift(this.name);
        }
        args.unshift(event);
        this.$emit(...args);
      }
    }
  };
</script>