import MutationObserver from 'mutation-observer';
import mdExtensionTheme from './extension.theme';
import MdAvatarButton from './AvatarButton';
import MdMessage from './Message';
import MdApp from './App';
import MdInkRipple from './mdInkRipple';

import './extension.scss';

const components = {
  MdAvatarButton,
  MdMessage,
  MdApp,
  MdInkRipple
};

const registeredThemes = ['default'];

export default function install(Vue) {
  const mdTextarea = Vue.component('md-textarea').options;
  /* eslint-disable func-names */
  mdTextarea.mounted.push(function () {
    const update = () => {
      /* global document */
      const evt = document.createEvent('Event');
      evt.initEvent('autosize:update', true, false);
      this.$el.dispatchEvent(evt);
    };
    this.$nextTick(update);
    this.observer = new MutationObserver(update);
    this.observer.observe(
      this.$el,
      { attributes: true, attributeFilter: ['disabled'] }
    );
  });
  mdTextarea.beforeDestroy.push(function () {
    if (this.observer) {
      this.observer.disconnect();
    }
  });

  /* eslint-disable global-require, import/newline-after-import */
  const MdSlider = require('./mdSlider/index').default;
  Vue.use(MdSlider);

  Object.keys(components).forEach((component) => {
    Vue.component(
      component.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
      Vue.extend(components[component])
    );
  });

  Vue.material.styles.push(mdExtensionTheme);

  /* eslint-disable no-param-reassign */
  /**
   * Patch Vue.material with shorthand method to register and
   * set a theme at once. Also apart from Vue.material standard
   * colors can be passed as string along with the hue as "color@hue"
   *
   * @param name
   * @param theme
   */
  Vue.material.registerAndSetTheme = (name, theme) => {
    if (registeredThemes.indexOf(name) < 0) {
      const normalizedTheme = {};
      Object.keys(theme).forEach((color) => {
        if (typeof theme[color] === 'string') {
          const parts = theme[color].split('@');
          if (parts.length > 1) {
            normalizedTheme[color] = { color: parts[0], hue: parseInt(parts[1], 10) };
          } else {
            normalizedTheme[color] = parts[0];
          }
        } else {
          normalizedTheme[color] = theme[color];
        }
      });
      Vue.material.registerTheme(name, normalizedTheme);
      registeredThemes.push(name);
    }
    Vue.material.setCurrentTheme(name);
  };
}
