import Index from './components/Index';
import Organization from './components/Organization';

export default {
  routes: [
    { path: '/', component: Index },
    { path: '/:organization_key', component: Organization }
  ]
};
