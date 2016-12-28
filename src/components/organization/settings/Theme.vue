<template>
  <div class="theme-changer">
    <div class="theme-changer-type"  v-for="(themeColor, key) in theme">
      <div
          class="theme-changer-label"
          :class="getColorClass(themeColor.color, themeColor.hue)"
          :style="{backgroundColor: palette[themeColor.color][themeColor.hue]}"
      >{{key}}</div>
      <md-input-container>
        <label>Color</label>
        <md-select
            md-menu-class="theme-changer-select"
            @change="onChange(key, $event)"
            :value="themeColor.color"
        >
          <md-option v-for="(hues, colorName) in palette" :value="colorName">
              <span :class="getColorClass(colorName, 500)" :style="{backgroundColor: hues[500]}">
                {{colorName}}
              </span>
          </md-option>
        </md-select>
      </md-input-container>
      <md-input-container>
        <label>Hue</label>
        <md-select
            md-menu-class="theme-changer-select"
            @change="onChange(key, themeColor.color, $event)"
            :value="themeColor.hue"
        >
          <md-option v-for="(color, hue) in palette[themeColor.color]" v-if="hue !== 'darkText'" :value="castHue(hue)">
          <span :class="getColorClass(themeColor.color, hue)" :style="{backgroundColor: color}">
            {{hue}}
          </span>
          </md-option>
        </md-select>
      </md-input-container>
    </div>
  </div>
</template>

<script>
  import palette from './palette';

  const defaultTheme = {
    primary: 'light-green',
    accent: 'lime',
    background: 'grey',
    warn: 'deep-orange'
  };

  export default {
    props: ['value'],
    data() {
      return {
        palette,
        theme: {}
      };
    },
    watch: {
      value: {
        immediate: true,
        handler(value) {
          this.setValue(value);
        }
      }
    },
    methods: {
      setValue(value) {
        const theme = Object.assign({}, defaultTheme, value);
        Object.keys(theme).forEach((key) => {
          const parts = theme[key].split('@');
          const color = parts[0];
          const hue = this.castHue(parts[1] || undefined);
          theme[key] = { color, hue };
        });
        this.theme = theme;
      },
      resetToDefaults() {
        let changed = false;
        Object.keys(defaultTheme).forEach((key) => {
          if (this.theme[key].color !== defaultTheme[key] || this.theme[key].hue !== 500) {
            this.theme[key] = { color: defaultTheme[key], hue: 500 };
            changed = true;
          }
        });
        if (changed) {
          this.$emit('input', {});
        }
      },
      getColorClass(color, hue) {
        let cls = 'theme-changer-';
        if (palette[color].darkText.indexOf(this.castHue(hue)) > -1) {
          cls += 'dark';
        } else {
          cls += 'light';
        }
        return cls;
      },
      castHue(hue) {
        if (typeof hue !== 'string') {
          return hue || 500;
        }
        return hue.match(/^[0-9]+$/) ? parseInt(hue, 10) : hue;
      },
      emitChange() {
        const newTheme = {};
        Object.keys(this.theme).forEach((key) => {
          if (this.theme[key].color !== defaultTheme[key] || this.theme[key].hue !== 500) {
            newTheme[key] = this.theme[key].color;
            if (this.theme[key].hue !== 500) {
              newTheme[key] += '@' + this.theme[key].hue;
            }
          }
        });
        this.$emit('input', newTheme);
      },
      onChange(key, color, hue) {
        if (!hue) {
          if (color !== this.theme[key].color) {
            this.theme[key] = { color, hue: 500 };
            this.emitChange();
          }
        } else if (hue !== this.theme[key].hue) {
          this.theme[key] = { color, hue };
          this.emitChange();
        }
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .theme-changer-light {
    color: #fff;
  }
  .theme-changer-dark {
    color: #000;
  }
  .theme-changer-select {
    .md-list-item-container {
      padding: 0 8px;
      .theme-changer-dark, .theme-changer-light {
        display: inline-block;
        min-width: 120px;
        padding: 0 8px;
      }
    }
  }
  .theme-changer {
    .theme-changer-label {
      display: inline-block;
      text-transform: capitalize;
      position: relative;
      top: -11px;
      min-width: 86px;
      border-radius: 2px;
      padding: 2px 6px;
    }
    .md-input-container {
      display: inline-block;
      margin-left: 16px;
    }
  }
</style>