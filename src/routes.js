import Index from './components/Index';
import Organization from './components/Organization';
import OrganizationOverview from './components/organization/Overview';
import OrganizationSettings from './components/organization/Settings';
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
        { path: 'settings', component: OrganizationSettings },
        { path: 'objectives', component: OrganizationObjectives },
        { path: 'ideas', component: OrganizationIdeas }
      ]
    }
  ]
};
