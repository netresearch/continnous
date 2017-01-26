<template>
  <div class="resources-card-form-container">
    <card-form
        class="resources-card-form"
        v-if="id !== undefined"
        :firebase-path="
          '/resources/organizations/' + organization.key
          + '/' + (personal ? auth.user.uid : 'organization')
          + '/' + type
          + '/' + (id || '{new}')"
        firebase-bind
        :firebase-receive="firebaseReceive"
        :defaults="{creator: auth.user.uid}"
        :keys="id ? ['updated'] : ['creator', 'created', 'updated']"
        :validate="{title: validateTitle}"
        ref="form"
        @closed="onClosed"
        @saved="onSaved"
        @before-save="saveFiles"
    >
      <template scope="form">

        <form-element name="title" :label="$t('fields.title')">
          <md-input :value="form.values.title" :placeholder="$t(type + '.title')"></md-input>
        </form-element>

        <div class="resources-card-form-content">
          <form-element name="subtitle" :label="$t('fields.subtitle.label')">
            <md-input :value="form.values.subtitle" :placeholder="$t('fields.subtitle.placeholder')"></md-input>
          </form-element>
          <form-element name="description" :label="$t('fields.description.label')">
            <md-textarea :value="form.values.description" :placeholder="$t('fields.description.placeholder')"></md-textarea>
          </form-element>

          <component :is="type + '-form'"></component>

          <md-layout md-gutter="24">
            <md-layout>
              <form-element :label="$t('fields.image')" name="image" style="flex: 1; min-width: 180px; max-width: 100%;">
                <form-file
                    ref="image"
                    gallery
                    accept="image/png,image/jpeg,image/jpg,image/gif"
                    :value="form.values.image"
                    :get-url="File.getURL"
                    :get-preview-url="File.getPreviewURL"
                    :register-preview-url="File.registerPreviewURL"
                ></form-file>
              </form-element>
            </md-layout>
            <md-layout>
              <form-element :label="$t('fields.attachments')" name="attachments" style="flex: 1; min-width: 180px;">
                <form-file
                    ref="attachments"
                    multiple
                    :value="form.values.attachments"
                    :get-url="File.getURL"></form-file>
              </form-element>
            </md-layout>
          </md-layout>
        </div>
      </template>

      <div slot="leftButtons" style="flex: 1;">
        <md-checkbox v-if="id === null" :value="personal" @click.native="personal = !personal">{{$t(type + '.personal')}}</md-checkbox>
      </div>
      <div slot="centerButtons" style="width: 24px;"></div>
    </card-form>
  </div>
</template>

<script>
  import CardForm from '../../form/Card';
  import auth from '../../../auth';
  import mixin from './mixin';
  import Config from '../../../models/Config';
  import Bus from '../../../bus';
  import File from '../../../models/File';
  import Firebase from '../../../firebase';

  const components = { CardForm };

  /* eslint-disable global-require, import/no-dynamic-require */
  Object.keys(Config.resources).forEach((resource) => {
    components[resource + '-form'] = require('./' + resource + '/Form');
  });

  export default {
    mixins: [mixin],
    props: ['organization', 'type'],
    components,
    data() {
      return {
        auth,
        personal: false,
        id: undefined,
        item: null,
        File
      };
    },
    watch: {
      $route: {
        immediate: true,
        handler(route) {
          this.personal = !!route.params.personal;
          this.id = route.params.id || null;
        }
      }
    },
    methods: {
      validateTitle(title) {
        return title && title.length > 2;
      },
      firebaseReceive(snapshot) {
        const item = this.createItem(snapshot.key, snapshot.val());
        Bus.$emit((this.id ? 'edit' : 'create') + '-resource', snapshot.key, this.$refs.form.values);
        return item;
      },
      onClosed(saved) {
        let path = '/' + this.organization.key + '/' + this.type;
        if (this.id || saved) {
          if (this.personal) {
            path += '/personal';
          }
          path += '/' + this.$refs.form.firebaseRef.key;
        }
        this.$router.push(path);
      },
      onSaved(updates, ref) {
        if (!this.personal) {
          if (this.id) {
            const keys = Object.keys(updates).filter(field => field !== 'updated');
            this.organization.journal.addEntry(this.type, this.id, 'update', keys);
          } else {
            this.organization.journal.addEntry(this.type, ref.key, 'create');
          }
        }
      },
      saveFiles(beforeSave, progress) {
        const ref = Firebase.storage().ref();
        ['image', 'attachments'].forEach((field) => {
          this.$refs[field].save((file) => {
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
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resources-list-container .resources-card-form-container {
    padding: 16px 16px 0;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    position: relative;
    max-width: 632px;
    &:before,
    &:after {
      display: block;
      content: "";
      width: 0;
      height: 0;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-right:10px solid rgba(#000, 0.2);
      position: absolute;
      left: 6px;
      top: 50px;
    }
    &:after {
      border-top-width: 9px;
      border-bottom-width: 9px;
      border-right: 9px solid #fff;
      margin-left: 1px;
      margin-top: 1px;
      z-index: 2;
    }
    .md-card {
      width: 100%;
      height: 100%;
    }
  }
</style>