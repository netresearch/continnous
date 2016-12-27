import mdExtensionTheme from './extension.theme';
import MdAvatarButton from './AvatarButton';
import MdMenuContent from './MenuContent';
import MdMessage from './Message';
import MdApp from './App';

import './extension.scss';

const components = {
  MdAvatarButton,
  MdMenuContent,
  MdMessage,
  MdApp
};

const registeredThemes = ['default'];

export default function install(Vue) {
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
          normalizedTheme[color] = { color: parts[0] };
          if (parts.length > 1) {
            normalizedTheme[color].hue = parts[1];
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
