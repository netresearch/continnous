<template>
  <div class="form">
    <slot :values="values" :errors="errors"></slot>
    <md-message :status="status" :progress="progress"></md-message>
  </div>
</template>

<script>
  import Vue from 'vue';
  import Firebase from '../../firebase';
  import Element from './Element';
  import Button from './Button';
  import File from './File';

  Vue.use((vm) => {
    vm.component('form-element', Element);
    vm.component('form-button', Button);
    vm.component('form-file', File);
  });

  /**
   * We have three different representations of the data object:
   * - value (internal): only called value to allow v-model binding to the form
   * - object (internal): A reference to value or to the firebase result
   * - values: The current form values - should be used to set values to inputs   *
   */
  export default {
    props: {
      keys: {
        type: Array,
        default: () => []
      },
      value: Object,
      firebasePath: {
        type: String,
        required: true
      },
      firebaseReceive: {
        type: Function,
        default(snapshot) {
          return snapshot.val() || {};
        }
      },
      firebaseBind: Boolean,
      validate: Object,
      /* {
       fieldKey => 'method'
       fieldKey => 'method1,method2'
       fieldKey => function(value) {}
       fieldKey => ['method', function(value) {}]
       } */
      filter: Object,
    },
    data() {
      return {
        object: Object.assign({}, this.value),
        values: Object.assign({}, this.value),
        elementKeys: [],
        changed: {},
        errors: {},
        status: undefined,
        waiting: false,
        progress: false
      };
    },
    computed: {
      allKeys() {
        return this.keys.concat(this.elementKeys).filter(
          (key, index, self) => self.indexOf(key) === index
        );
      }
    },
    watch: {
      firebasePath: {
        immediate: true,
        handler: 'bindToFirebase'
      },
      firebaseBind: {
        immediate: true,
        handler: 'bindToFirebase'
      },
      value: {
        deep: true,
        handler: 'takeOverValues'
      },
      allKeys() {
        this.$nextTick(() => {
          this.takeOverValues(this.object || this.value);
        });
      }
    },
    methods: {
      takeOverValues(values) {
        this.object = values;
        this.allKeys.forEach((key) => {
          if (!this.changed[key]) {
            if (values.hasOwnProperty(key)) {
              this.$set(this.values, key, values[key]);
            } else if (!this.isNewFirebaseRef()) {
              this.$delete(this.values, key);
            }
          }
        });
      },
      bindToFirebase() {
        this.$nextTick(() => {
          if (this.firebaseRef) {
            this.firebaseRef.off('value');
          }
          if (this.firebasePath && this.firebaseBind) {
            this.firebaseRef = this.getFirebaseRef();
            this.firebaseRef.on('value',
              (snapshot) => {
                this.takeOverValues(this.firebaseReceive.call(this.$parent, snapshot));
              },
              () => {
                this.status = -1;
              }
            );
          }
        });
      },
      isNewFirebaseRef() {
        return this.firebasePath && this.firebasePath.substr(-6) === '/{new}';
      },
      getFirebaseRef() {
        if (this.firebasePath.substr(-6) === '/{new}') {
          const parentPath = this.firebasePath.substr(0, this.firebasePath.length - 6);
          return Firebase.database().ref(parentPath).push();
        }
        return Firebase.database().ref(this.firebasePath);
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
        const present = this.object && this.object.hasOwnProperty(key) ? this.object[key] : '';
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
        if (this[type] && this[type].hasOwnProperty(key)) {
          if (typeof this[type][key] === 'string') {
            methods = this[type][key].split(',');
          } else if (Array.isArray(this[type][key])) {
            methods = this[type][key];
          } else {
            methods = [this[type][key]];
          }

          methods = methods.map(method => (typeof method === 'string' ? this.$parent[method] : method));

          for (let j = 0, m = methods.length; j < m; j++) {
            if (isFilter) {
              value = methods[j].call(this.$parent, value, key);
            } else if (!methods[j].call(this.$parent, value, key)) {
              return false;
            }
          }
        }
        return isFilter ? value : true;
      },
      isValid(key) {
        return !this.errors.hasOwnProperty(key);
      },
      hasChanged(includeInvalid) {
        const keys = this.allKeys;
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
      reset() {
        this.allKeys.forEach((key) => {
          this.$delete(this.changed, key);
          this.$delete(this.errors, key);
          this.$delete(this.values, key);
          if (this.object && this.object.hasOwnProperty(key)) {
            this.$set(this.values, key, this.object[key]);
          }
        });
      },
      save() {
        const keys = this.allKeys;
        const updates = {};
        const changedKeys = [];
        const isNew = this.isNewFirebaseRef();
        keys.forEach((key) => {
          if ((isNew && ['created', 'updated'].indexOf(key) > -1) || this.changed.hasOwnProperty(key)) {
            updates[key] = (isNew && key === 'created') || key === 'updated' ? +new Date() : this.values[key];
            changedKeys.push(key);
          }
        });

        if (Object.keys(updates).length) {
          this.status = 0;
          const beforeSave = [];
          const progress = {
            done: 0,
            total: 0,
            get: () => {
              let total;
              let done = 0;
              return {
                setTotal(newTotal) {
                  if (total) {
                    progress.total -= total;
                  }
                  progress.total += newTotal;
                  total = newTotal;
                },
                tick: (tick) => {
                  progress.done += tick - done;
                  this.progress = (progress.total && progress.total > progress.done)
                    ? ((progress.done / progress.total) * 100) : false;
                  done = tick;
                }
              };
            }
          };
          this.progress = false;
          this.$emit('before-save', beforeSave, progress);
          Promise.all(beforeSave).then(() => {
            this.progress = false;
            (this.firebaseRef || this.getFirebaseRef()).update(updates).then(
              () => {
                this.status = 1;
                changedKeys.forEach((key) => {
                  this.$delete(this.changed, key);
                });
                this.$emit('saved', updates);
              },
              () => {
                this.status = -1;
                this.$emit('save-error', updates);
              }
            );
          });
        }
      },
      _registerFormElement(element) {
        if (element.name) {
          this.elementKeys.push(element.name);
          element.$on('input', this.onChange);
        }
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .form-base-dialog {
    .md-dialog-title .md-input-container {
      margin: 0;
      margin-top: -16px;
    }
  }
</style>