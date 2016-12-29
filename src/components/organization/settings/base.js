import Firebase from 'firebase';

export default {
  data() {
    return {
      values: {},
      changed: {},
      errors: {},
      saved: {}
    };
  },
  created() {
    if (!this.$options.objectPath) {
      throw new Error('objectPath option required');
    }
    if (!this.$options.firebasePath) {
      throw new Error('firebasePath option required');
    }
    const bindToFirebase = () => {
      if (this.$options.bindToFirebase) {
        const firebasePath = this.getFirebasePath();
        if (!bindToFirebase.firebasePath || bindToFirebase.firebasePath !== firebasePath) {
          bindToFirebase.firebasePath = firebasePath;
          if (this.firebaseRef) {
            this.firebaseRef.off('value');
          }
          this.firebaseRef = Firebase.database().ref(firebasePath);
          this.firebaseRef.on('value', (snapshot) => {
            this.$set(
              this, this.$options.objectPath,
              this.$options.firebaseReceive.call(this, snapshot)
            );
          });
        }
      }
    };
    this.$watch(this.$options.objectPath, (newValue) => {
      this.values = Object.assign({}, newValue);
      this.$nextTick(bindToFirebase);
    }, { immediate: true });
  },
  firebaseReceive(snapshot) {
    return snapshot().val() || {};
  },
  bindToFirebase: false,
  validate: {
    // fieldKey => 'method'
    // fieldKey => 'method1,method2'
    // fieldKey => function(value) {}
    // fieldKey => ['method', function(value) {}]
  },
  filter: {
  },
  methods: {
    getFirebasePath() {
      let firebasePath = this.$options.firebasePath;
      if (typeof firebasePath === 'function') {
        firebasePath = firebasePath.call(this);
      }
      firebasePath = firebasePath.replace(/\/+$/);
      return firebasePath;
    },
    getSettingsObject() {
      const settingsPathParts = this.$options.objectPath.split('.');
      let object = this;
      for (let i = 0, l = settingsPathParts.length; i < l; i++) {
        object = object[settingsPathParts[i]];
      }
      return object;
    },
    onChange(key, value) {
      const object = this.getSettingsObject();
      const present = object.hasOwnProperty(key) ? object[key] : '';
      if (this.errors.hasOwnProperty(key)) {
        this.$delete(this.errors, key);
      }
      if (JSON.stringify(present) !== JSON.stringify(value)) {
        this.$set(this.changed, key, value);
        if (this.filterOrValidate('validate', key, value)) {
          this.$set(this.values, key, this.filterOrValidate('filter', key, value));
        } else {
          this.$delete(this.changed, key);
          this.$set(this.errors, key, true);
        }
      } else if (this.changed.hasOwnProperty(key)) {
        this.$delete(this.changed, key);
      }
    },
    filterOrValidate(type, key, incomingValue) {
      const isFilter = (type === 'filter');
      let value = incomingValue;
      let methods = [];
      if (this.$options[type].hasOwnProperty(key)) {
        if (typeof this.$options[type][key] === 'string') {
          methods = this.$options[type][key].split(',');
        } else if (Array.isArray(this.$options[type][key])) {
          methods = this.$options[type][key];
        } else {
          methods = [this.$options[type][key]];
        }

        methods = methods.map(method => (typeof method === 'string' ? this[method] : method));

        for (let j = 0, m = methods.length; j < m; j++) {
          if (isFilter) {
            value = methods[j].call(this, value);
          } else if (!methods[j].call(this, value)) {
            return false;
          }
        }
      }
      return isFilter ? value : true;
    },
    isValid(key) {
      return !this.errors.hasOwnProperty(key);
    },
    hasChanged(keysString, includeInvalid) {
      const keys = keysString.split('|');
      for (let i = 0, l = keys.length; i < l; i++) {
        if (this.changed.hasOwnProperty(keys[i])) {
          return true;
        }
        if (includeInvalid && this.errors[keys[i]]) {
          return true;
        }
      }
      return false;
    },
    reset(keysString) {
      const object = this.getSettingsObject();
      keysString.split('|').forEach((key) => {
        this.$delete(this.changed, key);
        this.$delete(this.errors, key);
        this.$delete(this.values, key);
        this.$nextTick(() => {
          if (object.hasOwnProperty(key)) {
            this.$set(this.values, key, object[key]);
          }
        });
      });
    },
    save(keysString) {
      const firebasePath = this.getFirebasePath();
      const keys = keysString.split('|');
      const updates = {};
      const changedKeys = [];
      keys.forEach((key) => {
        if (this.changed.hasOwnProperty(key)) {
          updates[firebasePath + '/' + key] = this.values[key];
          changedKeys.push(key);
        }
      });

      if (Object.keys(updates).length) {
        this.$set(this.saved, keysString, 0);
        Firebase.database().ref().update(updates).then(
          () => {
            this.$set(this.saved, keysString, 1);
            changedKeys.forEach((key) => {
              this.$delete(this.changed, key);
            });
            if (keys.indexOf('theme') > -1) {
              /* global document */
              document.location.reload();
            }
          },
          () => {
            this.$set(this.saved, keysString, -1);
          }
        );
      }
    }
  }
};
