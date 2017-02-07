import extend from 'extend';
import moment from 'moment';
import Firebase from '../../../firebase';
import auth from '../../../auth';
import ResourceImage from './Image';

export default {
  components: { ResourceImage },
  methods: {
    getFirebaseRef(branch, id) {
      return Firebase.database().ref(
        '/' + branch
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
    },
    toggleTrash(trash, item) {
      this.getFirebaseRef(!trash ? 'trash' : 'resources', item.id)
        .set(this.prepareItemForFirebase(item))
        .then(() => {
          this.organization.journal.addEntry(this.type, item.id, trash ? 'restore' : 'remove');
          this.getFirebaseRef(trash ? 'trash' : 'resources', item.id).remove();
        });
    },
    getLikesRef(item) {
      return Firebase.database().ref(
        '/likes/organizations/' + this.organization.key + '/' + auth.user.uid + '/' + item.id
      );
    },
    setLike(item, like) {
      const ref = this.getLikesRef(item);
      return (like ? ref.set(true) : ref.remove()).then(() => {
        if (like) {
          this.organization.journal.addEntry(this.type, item.id, 'like');
        } else {
          this.organization.journal.getRef().orderByChild('id').equalTo(item.id).once('value', (snapshot) => {
            snapshot.forEach((childSnapshot) => {
              const entry = childSnapshot.val();
              if (entry.uid === auth.user.uid && entry.action === 'like') {
                childSnapshot.ref.remove();
              }
            });
          });
        }
      });
    }
  },
};
