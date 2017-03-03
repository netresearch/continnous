import MdEditor from './mdEditor';
import MdEditorTheme from './mdEditor.theme';

export default function install(Vue) {
  Vue.component('md-editor', Vue.extend(MdEditor));

  Vue.material.styles.push(MdEditorTheme);
}
