import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

const available = ['en', 'de'];

function loadLocales(lang) {
  /* eslint-disable global-require, import/no-dynamic-require */
  const locales = require('./' + lang);
  Vue.locale(lang, locales);
}

loadLocales('en');
Vue.config.lang = 'en';

/* global navigator */
const lang = (navigator.language || navigator.userLanguage).replace(/^([a-z][a-z]).+$/, '$1');
if (available.indexOf(lang) > -1 && lang !== 'en') {
  loadLocales(lang);
  Vue.config.lang = lang;
  Vue.config.fallbackLang = 'en';
}

export default {};
