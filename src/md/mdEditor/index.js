import MdEditor from './mdEditor';
import MdEditorText from './mdEditorText';
import MdEditorTheme from './mdEditor.theme';

export default function install(Vue) {
  Vue.component('md-editor', Vue.extend(MdEditor));
  Vue.component('md-text', Vue.extend(MdEditorText));

  Vue.material.styles.push(MdEditorTheme);
}
