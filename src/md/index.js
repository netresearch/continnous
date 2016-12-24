import MdAvatarButton from './AvatarButton';
import MdLinkButton from './LinkButton';
import mdExtensionTheme from './extension.theme';

const components = {
  MdAvatarButton,
  MdLinkButton
};

export default function install(Vue) {
  Object.keys(components).forEach((component) => {
    Vue.component(
      component.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
      Vue.extend(components[component])
    );
  });

  Vue.material.styles.push(mdExtensionTheme);
}
