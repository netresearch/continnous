// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'vue-material/dist/vue-material.css';
import Vue from 'vue';
import VueMaterial from 'vue-material';
import VueRouter from 'vue-router';
import VueFire from 'vuefire';
import Routes from './routes';
import AdditionalVueMaterial from './md';

import './locales';
import './firebase';

import App from './App';

Vue.use(VueRouter);
Vue.use(VueFire);
Vue.use(VueMaterial);
Vue.use(AdditionalVueMaterial);
Vue.material.registerTheme('default', {
  primary: 'light-green',
  accent: 'lime',
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router: new VueRouter(Routes),
  template: '<App/>',
  components: { App },
});
