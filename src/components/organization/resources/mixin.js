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
    getLikesRef(id, all, byUser) {
      const path = '/likes/organizations/' + this.organization.key + '/by' + (byUser ? 'User' : 'Resource');
      const lastParts = [id, auth.user.uid];
      if (byUser) {
        lastParts.reverse();
      }
      if (all) {
        return Firebase.database().ref(path + '/' + lastParts.shift());
      }
      return Firebase.database().ref(path + '/' + lastParts.join('/'));
    },
    setLike(item, like) {
      const byResourceRef = this.getLikesRef(item.id, false, false);
      const byUserRef = this.getLikesRef(item.id, false, true);
      (like ? byResourceRef.set(true) : byResourceRef.remove()).then(() => {
        (like ? byUserRef.set(true) : byUserRef.remove()).then(() => {
          if (like) {
            this.organization.journal.addEntry(this.type, item.id, 'like');
          } else {
            // Remove all like journal entries
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
      });
    }
  },
};
