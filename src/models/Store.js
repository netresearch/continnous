import store from 'store';

const bound = {};

function setOrRemove(action, key, value) {
  const path = key.split('.');
  if (path.length > 1) {
    const mainObject = {};
    const first = path[0];
    const last = path.pop();
    mainObject[first] = bound.hasOwnProperty(first) ? bound[first] : store.get(first);
    let object = mainObject;
    while (path.length) {
      const currentKey = path.shift();
      if (object[currentKey] === undefined) {
        object[currentKey] = {};
      } else if (typeof object !== 'object') {
        throw new Error('Attempt to ' + action + ' property ' + currentKey + ' on primitive value');
      }
      object = object[currentKey];
    }
    if (action === 'set') {
      object[last] = value;
    } else {
      delete object[last];
    }
    store.set(first, mainObject[first]);
  } else {
    store[action](key, value);
  }
}

export default class Store {
  static bind(key, defaults) {
    if (!bound.hasOwnProperty(key)) {
      const value = store.get(key);
      bound[key] = typeof value === 'object' ? value : {};
    }
    if (defaults) {
      Object.keys(defaults).forEach((k) => {
        if (!bound[key].hasOwnProperty(k)) {
          bound[key][k] = defaults[k];
        }
      });
    }
    return bound[key];
  }

  static get(key, defaultValue) {
    const path = key.split('.');
    let value = store.get(path.shift());
    while (path.length) {
      if (typeof value !== 'object') {
        return defaultValue;
      }
      value = value[path.shift()];
    }
    return value === undefined ? defaultValue : value;
  }

  static set(key, value) {
    setOrRemove('set', key, value);
  }

  static remove(key) {
    setOrRemove('remove', key);
  }
}
