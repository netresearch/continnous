import MdSlider from './mdSlider';
import MdSliderTheme from './mdSlider.theme';

export default function install(Vue) {
  Vue.component('md-slider', Vue.extend(MdSlider));

  Vue.material.styles.push(MdSliderTheme);
}
