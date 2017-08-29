// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'vue-material/dist/vue-material.css';
import Vue from 'vue';
import VueMaterial from 'vue-material';
import VueRouter from 'vue-router';
import Routes from './routes';
import AdditionalVueMaterial from './md';

import './assets/styles.scss';
import './locales';
import './firebase';

import App from './App';

Vue.use(VueRouter);
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
    },
    $isArray(value) {
      return Object.prototype.toString.call(value) === '[object Array]';
    },
    $objectValues(object) {
      if (typeof object !== 'object') {
        return [];
      }
      const values = [];
      Object.keys(object).forEach((key) => {
        values.push(object[key]);
      });
      return values;
    },
    $timeOut(fn, timeout) {
      /* global window */
      window.setTimeout(fn, timeout);
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
/* global window */
new Vue({
  el: '#app',
  router: new VueRouter(Routes),
  template: '<App/>',
  components: { App },
  data() {
    return {
      historyLength: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      breakpoints: {
        xsmall: 600,
        small: 960,
        medium: 1280,
        large: 1920
      }
    };
  },
  watch: {
    $route() {
      this.historyLength++;
    }
  },
  created() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    });
  },
});
