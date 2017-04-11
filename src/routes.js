import Vue from 'vue';
import Index from './components/Index';
import Organization from './components/Organization';
import OrganizationOverview from './components/organization/Overview';
import OrganizationSettings from './components/organization/Settings';
import OrganizationSettingsGeneral from './components/organization/settings/General';
import OrganizationSettingsPermissions from './components/organization/settings/Permissions';
import OrganizationSettingsUsers from './components/organization/settings/Users';
import OrganizationSettingsConnections from './components/organization/settings/Connections';
import OrganizationResourcesPage from './components/organization/resources/Index';
import OrganizationResourcesSearch from './components/organization/resources/Search';
import OrganizationResourcesResource from './components/organization/resources/Detail';

import Config from './models/Config';

const config = require('../.firebaserc');

Vue.mixin({
  methods: {
    getUrlPath(id, personal, archive, type) {
      const params = typeof id === 'object' ? id : { id, personal, archive, type };
      ['type', 'personal', 'archive'].forEach((key) => {
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
        if (params.type || params.resource) {
          path += '/' + (params.type || params.resource);
        }
        if (params.personal) {
          path += '/personal';
        }
        if (params.archive) {
          path += '/archive';
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
      return path || '/';
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
        { path: 'users', component: OrganizationSettingsUsers },
        { path: 'connections', component: OrganizationSettingsConnections }
      ]
    }
  ]
};

Object.keys(Config.resources).forEach((resource) => {
  organizationRoute.children.push({
    path: ':type(' + resource + ')'
      + '/:personal(personal)?'
      + '/:archive(archive)?'
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

export default { mode: 'history', routes };
