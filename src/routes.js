import Index from './components/Index';
import Organization from './components/Organization';
import OrganizationOverview from './components/organization/Overview';
import OrganizationSettings from './components/organization/Settings';
import OrganizationSettingsGeneral from './components/organization/settings/General';
import OrganizationSettingsPermissions from './components/organization/settings/Permissions';
import OrganizationSettingsUsers from './components/organization/settings/Users';
import OrganizationObjectives from './components/organization/Objectives';
import OrganizationIdeas from './components/organization/Ideas';

export default {
  routes: [
    { path: '/', component: Index },
    {
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
        { path: 'objectives', component: OrganizationObjectives },
        { path: 'ideas', component: OrganizationIdeas }
      ]
    }
  ]
};
