<template>
  <div class="form">
    <slot :values="values" :errors="errors" :hasChanged="hasChanged"></slot>
    <md-message :status="status" :progress="progress"></md-message>
    <form-unload-protect v-if="protectUnload"></form-unload-protect>
  </div>
</template>

<script>
  import Vue from 'vue';
  import Firebase from '../../firebase';
  import Element from './Element';
  import Button from './Button';
  import File from './File';
  import Theme from './Theme';
  import Toc from './Toc';
  import UnloadProtect from './UnloadProtect';
  import { findParentForm } from './child';
  import Validators from './Validators';
  import Filters from './Filters';

  Vue.use((vm) => {
    vm.component('form-element', Element);
    vm.component('form-button', Button);
    vm.component('form-file', File);
    vm.component('form-theme', Theme);
    vm.component('form-toc', Toc);
    vm.component('form-unload-protect', UnloadProtect);
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
      protectUnload: {
        type: Boolean,
        default: true
      },
      value: Object,
      defaults: Object,
      firebasePath: {
        type: String
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
       fieldKey => {method1: true, method2: {length: 2}}
       } */
      filter: Object,
      mdInline: Boolean,
      disabled: Boolean,
      sub: Boolean,
      direct: Boolean
    },
    mounted() {
      if (this.sub) {
        const parent = findParentForm(this.$parent);
        parent.subForms.push(this);
        parent.$emit('sub-added', this);
        this.takeOverValues(parent.object);
        this.parentForm = parent;
        this.parentForm.subFormsChanged += Object.keys(this.changed).length;
        this.parentForm.subFormsErrors += Object.keys(this.errors).length;
      }
    },
    beforeDestroy() {
      if (this.sub && this.parentForm) {
        this.parentForm.subForms = this.parentForm.subForms.filter(form => form !== this);
        this.parentForm.$emit('sub-removed', this);
        this.parentForm.subFormsChanged -= Object.keys(this.changed).length;
        this.parentForm.subFormsErrors -= Object.keys(this.errors).length;
      }
    },
    data() {
      return {
        object: Object.assign({}, this.defaults, this.value),
        values: Object.assign({}, this.defaults, this.value),
        elementKeys: [],
        changed: {},
        errors: {},
        status: undefined,
        waiting: false,
        progress: false,
        parentForm: undefined,
        subFormsChanged: 0,
        subFormsErrors: 0,
        subFormsMissing: 0,
        elements: [],
        subForms: []
      };
    },
    computed: {
      allKeys() {
        return this.keys.concat(this.elementKeys).filter(
          (key, index, self) => self.indexOf(key) === index
        );
      },
      missing() {
        let missing = 0;
        this.allKeys.forEach((key) => {
          const targets = [this];
          const element = this.elements.find(el => el.name === key);
          if (element) {
            targets.push(element);
          }
          const isRequired = targets.find((target, isElement) => {
            if (target.validate && (isElement || target.validate.hasOwnProperty(key))) {
              const config = isElement ? target.validate : target.validate[key];
              let methods = [];
              if (typeof config === 'string') {
                methods = config.split(',');
              } else if (Array.isArray(config)) {
                methods = config;
              } else if (typeof config === 'object') {
                methods = Object.keys(config).filter(m => !!config[m]);
              }
              return methods.indexOf('required') > -1;
            }
            return false;
          });
          if (isRequired && !Validators.required(this.values[key])) {
            missing++;
          }
        });
        return missing;
      },
      subFormsMissing() {
        let missing = 0;
        this.subForms.forEach((subForm) => {
          missing += subForm.missing + subForm.subFormsMissing;
        });
        return missing;
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
        immediate: true,
        handler: 'takeOverValues'
      },
      allKeys() {
        this.$nextTick(() => {
          this.takeOverValues(this.object || this.value);
        });
      },
      subFormsChanged(newVal, oldVal) {
        if (this.sub && this.parentForm) {
          this.parentForm.subFormsChanged += newVal - oldVal;
        }
      },
      subFormsErrors(newVal, oldVal) {
        if (this.sub && this.parentForm) {
          this.parentForm.subFormsErrors += newVal - oldVal;
        }
      }
    },
    methods: {
      takeOverValues(values) {
        this.object = Object.assign({}, this.defaults, this.value, values);
        this.allKeys.forEach((key) => {
          if (!this.changed[key]) {
            if (values && values.hasOwnProperty(key)) {
              this.$set(this.values, key, values[key]);
            } else if (!this.isNewFirebaseRef()) {
              this.$delete(this.values, key);
            }
          }
        });
        if (this.subForms) {
          this.subForms.forEach((subForm) => {
            subForm.takeOverValues(this.object);
          });
        }
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
        if (this.sub) {
          return this.parentForm ? this.parentForm.isNewFirebaseRef() : false;
        }
        return this.firebasePath && this.firebasePath.substr(-6) === '/{new}';
      },
      getFirebaseRef() {
        if (this.sub) {
          return this.parentForm ? this.parentForm.getFirebaseRef() : undefined;
        }
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
        if (this.sub && this.parentForm) {
          this.parentForm.subFormsErrors -= Object.keys(this.errors).length;
          this.parentForm.subFormsChanged -= Object.keys(this.changed).length;
        }
        if (this.errors.hasOwnProperty(key)) {
          this.$delete(this.errors, key);
        }
        if (JSON.stringify(present) !== JSON.stringify(value)) {
          this.$set(this.changed, key, value);
          if (this.filterOrValidate('validate', key, value)) {
            this.$set(this.values, key, this.filterOrValidate('filter', key, value));
            if (this.direct) {
              this.save();
            }
          } else {
            this.$delete(this.changed, key);
            this.$set(this.errors, key, true);
          }
        } else {
          this.$set(this.values, key, present);
          if (this.changed.hasOwnProperty(key)) {
            this.$delete(this.changed, key);
          }
        }
        if (this.sub && this.parentForm) {
          this.parentForm.subFormsErrors += Object.keys(this.errors).length;
          this.parentForm.subFormsChanged += Object.keys(this.changed).length;
        }
      },
      filterOrValidate(type, key, incomingValue) {
        const isFilter = (type === 'filter');
        const lib = isFilter ? Filters : Validators;
        let value = incomingValue;
        const targets = [this];
        const element = this.elements.find(el => el.name === key);
        if (element) {
          targets.push(element);
        }
        const isValid = targets.every((target, isElement) => {
          if (target[type] && (isElement || target[type].hasOwnProperty(key))) {
            let options = {};
            const config = isElement ? target[type] : target[type][key];
            let methods = [];
            if (typeof config === 'string') {
              methods = config.split(',');
            } else if (Array.isArray(this[type][key])) {
              methods = config;
            } else if (typeof config === 'function') {
              methods = [config];
            } else if (typeof config === 'object') {
              methods = Object.keys(config).filter(m => !!config[m]);
              options = config;
            }

            for (let j = 0, m = methods.length; j < m; j++) {
              let method = methods[j];
              if (typeof method === 'string') {
                method = (lib[method] || target.$parent[method])
                  .bind(target.$parent, value, key, options[method]);
              } else {
                method = method.bind(target.$parent, value, key);
              }
              if (isFilter) {
                value = method();
              } else if (!method()) {
                return false;
              }
            }
          }
          return true;
        });
        return isFilter ? value : isValid;
      },
      isValid(recursive) {
        if (this.missing || recursive && (this.subFormsErrors || this.subFormsMissing)) {
          return false;
        }
        const keys = this.allKeys;
        for (let i = 0, l = keys.length; i < l; i++) {
          if (this.errors[keys[i]]) {
            return false;
          }
        }
        return true;
      },
      hasChanged(includeInvalid, recursive) {
        if (recursive) {
          if (this.subFormsErrors) {
            return includeInvalid;
          } else if (this.subFormsChanged) {
            return true;
          }
        }
        const keys = this.allKeys;
        for (let i = 0, l = keys.length; i < l; i++) {
          if (this.errors[keys[i]]) {
            return includeInvalid;
          }
          if (this.changed.hasOwnProperty(keys[i])) {
            return true;
          }
        }
        return false;
      },
      reset(clear, recursive) {
        if (this.sub && this.parentForm) {
          this.parentForm.subFormsErrors -= Object.keys(this.errors).length;
          this.parentForm.subFormsChanged -= Object.keys(this.changed).length;
        }
        if (recursive) {
          this.subForms.forEach(form => form.reset(clear, recursive));
        }
        if (clear) {
          this.changed = {};
          this.errors = {};
          this.values = Object.assign({}, this.defaults, this.value);
          this.object = Object.assign({}, this.defaults, this.value);
          return;
        }
        this.allKeys.forEach((key) => {
          this.$delete(this.changed, key);
          this.$delete(this.errors, key);
          this.$delete(this.values, key);
          if (!clear && this.object && this.object.hasOwnProperty(key)) {
            this.$set(this.values, key, this.object[key]);
          }
        });
      },
      save(recursive) {
        const isNew = this.isNewFirebaseRef();

        const forms = [];
        const updates = {};
        const getUpdates = (form) => {
          const fields = [];
          const keys = form.allKeys;
          keys.forEach((key) => {
            const isDateField = (isNew && key === 'created') || key === 'updated';
            if (isDateField
              || (isNew && form.values[key] !== undefined)
              || form.changed.hasOwnProperty(key)) {
              updates[key] = isDateField ? +new Date() : form.values[key];
              fields.push(key);
            }
          });
          if (fields.length) {
            forms.push({ form, fields });
          }
          if (recursive) {
            form.subForms.forEach((subForm) => {
              getUpdates(subForm);
            });
          }
        };
        getUpdates(this);

        let resolve;
        let reject;
        const promise = new Promise((rs, rj) => {
          resolve = rs;
          reject = rj;
        });

        if (Object.keys(updates).length) {
          this.status = 0;
          const beforeSave = [];
          this.progress = false;
          this.$emit('progress', this.progress);
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
                  this.$emit('progress', this.progress);
                  done = tick;
                }
              };
            }
          };
          const $emit = (...args) => {
            forms.forEach((form) => {
              /* Not necessary for now
              form.fields.forEach((field) => {
                form.form.elements.filter(element => element.name === field).forEach(
                  element => element.$emit(...args)
                );
              }); */
              form.form.$emit(...args);
            });
          };
          $emit('before-save', updates, beforeSave, progress);
          Promise.all(beforeSave).then(
            () => {
              this.$emit('progress', this.progress);
              this.progress = false;
              const ref = this.firebaseRef || this.getFirebaseRef();
              return ref.update(updates).then(
                () => {
                  const afterSave = [];
                  $emit('after-save', updates, afterSave, progress);
                  Promise.all(afterSave).then(() => {
                    this.status = 1;
                    forms.forEach((form) => {
                      if (form.form.sub && form.form.parentForm) {
                        form.form.parentForm.subFormsChanged -= form.fields.length;
                      }
                      form.fields.forEach((key) => {
                        form.form.$delete(form.form.changed, key);
                      });
                    });
                    $emit('saved', updates, ref);
                    resolve(updates);
                  });
                }
              );
            },
            (e) => {
              this.status = -1;
              $emit('save-error', updates);
              reject(e);
            }
          );
        } else {
          resolve();
        }
        return promise;
      },
      _registerFormElement(element) {
        this.elements.push(element);
        this.$emit('element-added', element);
        if (element.name) {
          this.elementKeys.push(element.name);
          if (this.object && this.object.hasOwnProperty(element.name)) {
            this.$set(this.values, element.name, this.object[element.name]);
          }
        }
      },
      _unregisterFormElement(element) {
        this.elements = this.elements.filter(e => e !== element);
        this.$emit('element-removed', element);
        if (element.name) {
          this.elementKeys = this.elementKeys.filter(name => name !== element.name);
          this.$delete(this.changed, element.name);
          this.$delete(this.errors, element.name);
          this.$delete(this.values, element.name);
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