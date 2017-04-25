import MdEditor from './mdEditor';
import MdEditorText from './mdEditorText';
import MdEditorTheme from './mdEditor.theme';
import MdMentions from './mdMentions';

export default function install(Vue) {
  Vue.component('md-editor', Vue.extend(MdEditor));
  Vue.component('md-editor-text', Vue.extend(MdEditorText));
  Vue.component('md-mentions', Vue.extend(MdMentions));

  Vue.material.styles.push(MdEditorTheme);
}
