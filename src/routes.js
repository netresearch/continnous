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
    },
    {
      path: 'search',
      component: OrganizationResourcesSearch
    }
  ]
};

Object.keys(Config.resources).forEach((resource) => {
  organizationRoute.children.push({
    path: ':type(' + resource + ')/:personal(personal)?/:trash(trash)?',
    component: OrganizationResourcesPage
  });
  organizationRoute.children.push({
    path: ':type(' + resource + ')/:personal(personal)?/:id(-[^/]+)',
    component: OrganizationResourcesResource
  });
  organizationRoute.children.push({
    path: ':type(' + resource + ')/:personal(personal)?/create',
    component: OrganizationResourcesResource
  });
  organizationRoute.children.push({
    path: 'search/:type(' + resource + ')?/:personal(personal)?',
    component: OrganizationResourcesSearch
  });
});

export default {
  routes: [
    { path: '/', component: Index },
    organizationRoute
  ]
};
