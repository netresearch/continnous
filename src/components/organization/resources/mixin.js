import extend from 'extend';
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
      if (!this.storageRef) {
        this.storageRef = Firebase.storage().ref();
      }
      const item = Object.assign({}, data, { id });
      const createFileObject = (file) => {
        const fileObject = Object.assign({ src: undefined, preview: undefined }, file);
        ['src', 'preview'].forEach((key) => {
          const child = this.storageRef.child(file.id + (key === 'src' ? '' : '_' + key));
          child.getDownloadURL().then((url) => {
            fileObject[key] = url;
          }, () => {});
        });
        return fileObject;
      };
      if (item.image) {
        item.image = createFileObject(item.image);
      }
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
      const restoreFileObject = (fileObject) => {
        delete fileObject.preview;
        delete fileObject.src;
      };
      if (item.image) {
        restoreFileObject(item.image);
      }
      delete item.resource;
      delete item.personal;
      return fbItem;
    }
  },
};
