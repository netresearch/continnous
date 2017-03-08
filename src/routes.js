import Vue from 'vue';
import Index from './components/Index';
import Organization from './components/Organization';
import OrganizationOverview from './components/organization/Overview';
import OrganizationSettings from './components/organization/Settings';
import OrganizationSettingsGeneral from './components/organization/settings/General';
import OrganizationSettingsPermissions from './components/organization/settings/Permissions';
import OrganizationSettingsUsers from './components/organization/settings/Users';
import OrganizationResourcesPage from './components/organization/resources/Index';
import OrganizationResourcesSearch from './components/organization/resources/Search';
import OrganizationResourcesResource from './components/organization/resources/Detail';

import Config from './models/Config';

const config = require('../.firebaserc').config;

Vue.mixin({
  methods: {
    getUrlPath(id, personal, trash, type) {
      const params = typeof id === 'object' ? id : { id, personal, trash, type };
      ['type', 'personal', 'trash'].forEach((key) => {
        if (params[key] === undefined) {
          params[key] = this[key];
        }
      });
      let path = '';
      if (this.$route.params.organization_key) {
        path += '/' + this.$route.params.organization_key;
      }
      if (params.settings) {
        path += '/settings' + (params.settings === true ? '' : '/' + params.settings);
      } else {
        if (params.search) {
          path += '/search';
        }
        if (params.type) {
          path += '/' + params.type;
        }
        if (params.personal) {
          path += '/personal';
        }
        if (params.trash) {
          path += '/trash';
        }
        if (params.period) {
          path += '/' + params.period;
        }
        if (params.create) {
          path += '/create';
        }
        if (params.id) {
          path += '/' + params.id;
        }
      }
      return path;
    },
    getHref(...args) {
      return (this.$router.mode === 'hash' ? '/#' : '') + this.getUrlPath(...args);
    }
  }
});

const organizationRoute = {
  path: '/:organization_key',
  component: Organization,
  children: [
    { path: '', component: OrganizationOverview },
    {
      path: 'settings',
      component: OrganizationSettings,
      children: [
        { path: '', component: OrganizationSettingsGeneral },
        { path: 'permissions', component: OrganizationSettingsPermissions },
        { path: 'users', component: OrganizationSettingsUsers }
      ]
    }
  ]
};

Object.keys(Config.resources).forEach((resource) => {
  organizationRoute.children.push({
    path: ':type(' + resource + ')'
      + '/:personal(personal)?'
      + '/:trash(trash)?'
      + '/:period(q[1-4]-[0-9]{4})?',
    component: OrganizationResourcesPage,
    children: [
      { path: ':id(-[^/]+)/:edit(edit)?', component: OrganizationResourcesResource },
      { path: 'create', component: OrganizationResourcesResource }
    ]
  });
  organizationRoute.children.push({
    path: ':search(search)'
      + '/:type(' + resource + ')?'
      + '/:personal(personal)?',
    component: OrganizationResourcesSearch,
    children: [
      { path: ':id(-[^/]+)/:edit(edit)?', component: OrganizationResourcesResource },
      { path: 'create', OrganizationResourcesResource }
    ]
  });
});

const routes = [];

/* global document */
if ([config.authDomain, 'localhost'].indexOf(document.location.hostname) < 0) {
  organizationRoute.path = '/';
  organizationRoute.props = { domain: document.location.hostname };
} else {
  routes.push({ path: '/', component: Index });
}

routes.push(organizationRoute);

export default { routes };
