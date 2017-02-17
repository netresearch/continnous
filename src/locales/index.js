import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

const available = ['en', 'de'];

function loadLocales(lang) {
  return new Promise((resolve) => {
    /* eslint-disable global-require, import/no-dynamic-require */
    require(['./' + lang], (locales) => {
      resolve(locales);
    });
  });
}

const api = {
  available,
  current() {
    return Vue.config.lang;
  },
  set(lang) {
    let l = lang;
    if (available.indexOf(l) < 0) {
      l = available[0];
    }
    return new Promise((resolve) => {
      Vue.locale(l, loadLocales.bind(null, l), () => {
        Vue.config.lang = l;
        resolve();
      });
    });
  },
  setFromNavigator() {
    /* global navigator */
    return api.set(
      (navigator.language || navigator.userLanguage).replace(/^([a-z][a-z]).+$/, '$1')
    );
  }
};

export default api;
