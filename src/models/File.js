import Vue from 'vue';
import Firebase from '../firebase';
import FileElement from '../components/form/File';
import FormElement from '../components/form/Base';

const sources = {};
const srcListeners = {};
let storageRef;

const fireListeners = (key) => {
  if (srcListeners.hasOwnProperty(key)) {
    srcListeners[key].forEach((listener) => {
      listener(sources[key]);
    });
    srcListeners[key] = [];
  }
};

const getStorageKey = (id, type) => id + (type === 'src' ? '' : '_' + type);

const getURL = (id, type, callback) => {
  const key = getStorageKey(typeof id === 'object' ? id.id : id, type);
  if (!srcListeners.hasOwnProperty(key)) {
    let srcRegistered = false;
    srcListeners[key] = [
      () => {
        srcRegistered = true;
      },
      callback
    ];
    if (sources[key]) {
      fireListeners(key);
    }
    Vue.nextTick(() => {
      if (!srcRegistered) {
        if (!storageRef) {
          storageRef = Firebase.storage().ref();
        }
        const child = storageRef.child(key);
        child.getDownloadURL().then((src) => {
          sources[key] = src;
          fireListeners(key);
        }, () => {});
      }
    });
  } else if (sources[key]) {
    callback(sources[key]);
  } else {
    srcListeners[key].push(callback);
  }
};

const registerURL = (id, type, src) => {
  const key = getStorageKey(typeof id === 'object' ? id.id : id, type);
  sources[key] = src;
  fireListeners(key);
};

export default class File {
  static getPreviewURL(file, callback) {
    return getURL(file, 'preview', callback);
  }

  static getURL(file, callback) {
    return getURL(file, 'src', callback);
  }

  static registerPreviewURL(file, url) {
    registerURL(file, 'preview', url);
  }

  static registerURL(file, url) {
    registerURL(file, 'src', url);
  }
}

FileElement.props.getPreviewUrl.default = File.getPreviewURL;
FileElement.props.getUrl.default = File.getURL;
FileElement.props.registerPreviewUrl.default = File.registerPreviewURL;
FileElement.isFileElement = true;

if (!FormElement.mixins) {
  FormElement.mixins = [];
}
FormElement.mixins.push({
  created() {
    this.$on('after-save', (beforeSave, progress) => {
      const ref = Firebase.storage().ref();
      this.elements.filter(
        element => element.$refs.el.$options.isFileElement
      ).forEach((element) => {
        element.$refs.el.save((file) => {
          const promises = [];
          if (file.deleted) {
            const children = [file.id];
            if (file.preview) {
              children.push(file.id + '_preview');
            }
            children.forEach((child) => {
              promises.push(new Promise((resolve, reject) => {
                ref.child(child).delete().then(resolve).catch(reject);
              }));
            });
          } else {
            let totalBytes = 0;
            const monitorUpload = (task) => {
              promises.push(new Promise((resolve, reject) => {
                let totalBytesAdded = false;
                const fileProgress = progress ? progress.get() : null;
                task.on('state_changed', (snapshot) => {
                  if (!totalBytesAdded) {
                    totalBytesAdded = true;
                    totalBytes += snapshot.totalBytes;
                    if (fileProgress) {
                      fileProgress.setTotal(snapshot.totalBytes);
                    }
                  }
                  file.progress = (snapshot.bytesTransferred / totalBytes) * 100;
                  if (fileProgress) {
                    fileProgress.tick(snapshot.bytesTransferred);
                  }
                }, (error) => {
                  file.error = error;
                  reject(error);
                }, resolve);
              }));
            };
            monitorUpload(ref.child(file.id).put(file.file));
            if (file.preview) {
              monitorUpload(ref.child(file.id + '_preview').putString(
                file.preview.split(',').pop(), 'base64', {
                  contentType: 'image/png',
                }
              ));
            }
          }
          beforeSave.push(Promise.all(promises));
        });
      });
    });
  }
});
