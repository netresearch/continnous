<template>
  <div class="md-slider" :class="[themeClass, {'md-slider-zero': isAtMinimum}]" :disabled="disabled">
    <div ref="slider"></div>
  </div>
</template>

<style lang="scss" src="./mdSlider.scss"></style>

<script>
  import NoUiSlider from 'nouislider';
  import Vue from 'vue';

  export default {
    mixins: Vue.component('md-button').options.mixins,
    props: {
      value: [String, Number, Array],
      disabled: Boolean,
      start: {
        type: [String, Number, Array],
        default: 0
      },
      connect: {
        type: [Boolean, Array],
        default() {
          return [true, false];
        }
      },
      margin: [String, Number],
      limit: [String, Number],
      padding: [String, Number],
      step: [String, Number],
      vertical: Boolean,
      rtl: Boolean,
      tooltips: [Boolean, Function, Array],
      min: {
        type: [String, Number, Array],
        default: 0
      },
      max: {
        type: [String, Number, Array],
        required: true
      },
      distribute: Object,
      snap: Boolean,
      snaps: Boolean,
      format: {
        type: Object,
        default() {
          return {
            to(value) {
              return Math.round(value);
            },
            from(value) {
              return value;
            }
          };
        }
      }
    },
    data() {
      return {
        isAtMinimum: false
      };
    },
    computed: {
      updatableOptions() {
        const options = {};
        ['margin', 'limit', 'step'].forEach((option) => {
          if (this[option] !== undefined) {
            options[option] = this.getNumber(this[option]);
          }
        });
        if (this.snap !== undefined) {
          options.snap = this.snap;
        }
        options.range = { min: this.getNumberOrArray(this.min) };
        if (this.distribute) {
          Object.keys(this.distribute).forEach((key) => {
            options.range[key] = this.getNumberOrArray(this.distribute[key]);
          });
        }
        options.range.max = this.getNumberOrArray(this.max);
        return options;
      },
      nonUpdatableOptions() {
        const options = {
          start: this.getNumberOrArray(this.start),
          format: this.format
        };
        if (this.padding !== undefined) {
          options.padding = this.getNumber(this.padding);
        }
        if (this.vertical) {
          options.orientation = 'vertical';
        }
        if (this.rtl) {
          options.direction = 'rtl';
        }
        if (this.tooltips) {
          options.tooltips = this.tooltips;
        }
        options.connect = this.connect;
        if (this.snaps) {
          options.pips = {
            mode: 'steps',
            density: 2
          };
        }
        return options;
      }
    },
    watch: {
      updatableOptions(options) {
        if (this.slider) {
          this.slider.updateOptions(options);
        }
      },
      nonUpdatableOptions() {
        this.$nextTick(() => {
          if (this.slider) {
            this.destroySlider();
            this.createSlider();
          }
        });
      },
      value(value) {
        if (this.slider) {
          this.slider.set(value === undefined ? value : this.getNumberOrArray(value));
        }
      }
    },
    mounted() {
      this.createSlider();
    },
    beforeDestroy() {
      if (this.slider) {
        this.destroySlider();
      }
    },
    methods: {
      destroySlider() {
        this.slider.off('change');
        this.slider.off('update');
        this.slider.destroy();
      },
      createSlider() {
        this.slider = NoUiSlider.create(
          this.$refs.slider,
          Object.assign(
            this.updatableOptions,
            this.nonUpdatableOptions,
            { cssPrefix: 'md-slider-' }
          )
        );

        this.slider.on('update', (value) => {
          const d = {
            v: value !== undefined ? this.getNumberOrArray(value) : this.nonUpdatableOptions.start,
            m: this.updatableOptions.range.min
          };
          ['m', 'v'].forEach((key) => {
            if (typeof d[key] !== 'number' && d[key].length === 1) {
              d[key] = d[key][0];
            }
          });
          this.isAtMinimum = d.m === d.v;
        });

        this.slider.on('change', (value) => {
          this.currentValue = value;
          this.$emit('change', value);
          this.$emit('input', value);
        });

        if (this.value !== undefined) {
          this.slider.set(this.getNumberOrArray(this.value));
        }
      },
      getNumber(value) {
        if (typeof value === 'number') {
          return value;
        }
        if (typeof value === 'string') {
          const res = parseFloat(value);
          if (isNaN(res)) {
            throw new Error(value + ' could not be parsed');
          }
          return res;
        }
        throw new Error(value + ' could not be parsed');
      },
      getNumberOrArray(value) {
        try {
          return this.getNumber(value);
        } catch (e) {
          if (value) {
            const res = [];
            value.forEach(v => res.push(this.getNumber(v)));
            return res;
          }
          throw e;
        }
      }
    }
  };
</script>