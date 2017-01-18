import Firebase from '../../../firebase';
import ResourceImage from './Image';

export default {
  components: { ResourceImage },
  methods: {
    createItem(id, data) {
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
      return item;
    }
  },
};
