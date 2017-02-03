import extend from 'extend';
import moment from 'moment';
import Firebase from '../../../firebase';
import auth from '../../../auth';
import ResourceImage from './Image';

export default {
  components: { ResourceImage },
  methods: {
    getFirebaseRef(trash, id) {
      return Firebase.database().ref(
        '/' + (trash ? 'trash' : 'resources')
        + '/organizations/' + this.organization.key
        + '/' + (this.personal ? auth.user.uid : 'organization')
        + '/' + this.type
        + (id ? '/' + id : '')
      );
    },
    createItem(id, data, resource, personal) {
      const item = Object.assign({}, data, { id });
      if (resource) {
        item.resource = resource;
      }
      if (personal !== undefined) {
        item.personal = personal;
      }
      return item;
    },
    prepareItemForFirebase(item) {
      const fbItem = extend(true, {}, item);
      delete item.resource;
      delete item.personal;
      return fbItem;
    },
    moment(time) {
      return moment(time);
    }
  },
};
