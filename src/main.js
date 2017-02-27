// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'vue-material/dist/vue-material.css';
import Vue from 'vue';
import VueMaterial from 'vue-material';
import VueRouter from 'vue-router';
import VueFire from 'vuefire';
import Routes from './routes';
import AdditionalVueMaterial from './md';

import './assets/styles.scss';
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
Vue.mixin({
  methods: {
    $log(...args) {
      if (!Vue.config.silent) {
        /* eslint-disable no-console */
        console.log(...args);
        /* eslint-enable no-console */
      }
      return args[0];
    }
  },
  filters: {
    ucfirst(v) {
      if (typeof v === 'string') {
        return v.substr(0, 1).toUpperCase() + v.substr(1);
      }
      return v;
    },
    lcfirst(v) {
      if (typeof v === 'string') {
        return v.substr(0, 1).toLowerCase() + v.substr(1);
      }
      return v;
    }
  }
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router: new VueRouter(Routes),
  template: '<App/>',
  components: { App },
});
