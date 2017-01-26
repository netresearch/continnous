import Vue from 'vue';
import Firebase from '../firebase';

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
