<template>
  <div class="form-toc">
    <div class="form-toc-entry" v-for="(element, i) in elements">
      <span @click="elementClicked(i)" :class="{'form-toc-active': i === focusedElement}">{{element}}</span>
    </div>
  </div>
</template>

<script>
  import Child from './child';

  export default {
    extends: Child,
    data() {
      return {
        elements: [],
        focusedElement: undefined
      };
    },
    mounted() {
      this.registerForm(this.form);
      /* global document */
      document.body.addEventListener('click', this.onBodyClick);
    },
    beforeDestroy() {
      this.unregisterForm(this.form);
      /* global document */
      document.body.removeEventListener('click', this.onBodyClick);
    },
    methods: {
      registerForm(form) {
        form.$on('element-added', this.rescan);
        form.$on('element-removed', this.rescan);
        form.$on('sub-added', this.registerForm);
        form.$on('sub-removed', this.unregisterForm);
        this.rescan();
      },
      unregisterForm(form) {
        form.$off('element-added', this.rescan);
        form.$off('element-removed', this.rescan);
        form.$off('sub-added', this.registerForm);
        form.$off('sub-removed', this.unregisterForm);
        if (form !== this.form) {
          this.rescan();
        }
      },
      onBodyClick(e) {
        if (this.$els) {
          this.focusedElement = undefined;
          this.$els.forEach(($el, i) => {
            if (e.target === $el || $el.contains(e.target)) {
              this.focusedElement = i;
            }
          });
        }
      },
      onInputFocus(e) {
        this.focusedElement = this.$inputs.indexOf(e.target);
      },
      rescan() {
        this.$nextTick(() => {
          if (this.$inputs) {
            this.$inputs.forEach(($input) => {
              $input.removeEventListener('focus', this.onInputFocus);
            });
          }
          this.$inputs = [];
          this.$els = [];
          this.elements = [];
          if (this.form && this.form.$el) {
            this.form.$el.querySelectorAll('div.form-element').forEach(($el) => {
              const $label = $el.querySelector('label');
              const label = $label ? $label.innerText : null;
              const $input = $el.querySelector('input, textarea, select');
              if (label && $input) {
                $input.addEventListener('focus', this.onInputFocus);
                this.elements.push(label);
                this.$inputs.push($input);
                this.$els.push($el);
              }
            });
          }
        });
      },
      elementClicked(i) {
        const $input = this.$inputs[i];
        /* global window */
        window.setTimeout(() => { $input.focus(); }, 100);
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .form-toc-entry span {
    cursor: pointer;
    color: rgba(#000, 0.68);
    &:hover, &.form-toc-active {
      color: inherit;
    }
  }
</style>