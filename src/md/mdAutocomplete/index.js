import MdAutocomplete from './mdAutocomplete';
import MdAutocompleteTheme from './mdAutocomplete.theme';

export default function install(Vue) {
  Vue.component('md-autocomplete', Vue.extend(MdAutocomplete));

  Vue.material.styles.push(MdAutocompleteTheme);
}
