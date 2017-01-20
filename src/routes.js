import Index from './components/Index';
import Organization from './components/Organization';
import OrganizationOverview from './components/organization/Overview';
import OrganizationSettings from './components/organization/Settings';
import OrganizationSettingsGeneral from './components/organization/settings/General';
import OrganizationSettingsPermissions from './components/organization/settings/Permissions';
import OrganizationSettingsUsers from './components/organization/settings/Users';
import OrganizationResourcesPage from './components/organization/resources/Page';
import OrganizationResourcesForm from './components/organization/resources/Form';

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
    }
  ]
};

Object.keys(Config.resources).forEach((resource) => {
  organizationRoute.children.push({
    path: ':type(' + resource + ')/:personal(personal)?/:trash(trash)?/:id(-.+)?',
    name: resource,
    component: OrganizationResourcesPage,
    children: [
      { path: 'create', component: OrganizationResourcesForm },
      { path: 'edit', component: OrganizationResourcesForm }
    ]
  });
});

export default {
  routes: [
    { path: '/', component: Index },
    organizationRoute
  ]
};
