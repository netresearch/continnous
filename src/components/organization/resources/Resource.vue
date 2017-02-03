<template>
  <div class="resource scroll-container">
    <md-toolbar class="md-dense">
      <h2 class="md-title">{{$tc('resources.' + type, 2)}}</h2>
    </md-toolbar>
    <div class="scroll-content">
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
          @saved="onSaved"
          @before-save="saveFiles"
          md-inline
      >

        <form-element class="resource-title" type="md-textarea" md-inline name="title" :label="$t('fields.title')" :placeholder="$t(type + '.title')">
        </form-element>

        <form-element class="resource-subtitle" type="md-textarea" name="subtitle" :label="$t('fields.subtitle.label')" :placeholder="$t('fields.subtitle.placeholder')">
        </form-element>

        <form-element
            type="form-file"
            name="image"
            :label="$t('fields.image')"
            style="flex: 1; min-width: 180px; max-width: 100%;"
            ref="image"
            gallery
            accept="image/png,image/jpeg,image/jpg,image/gif"
            :inline="!!id"
            :get-url="File.getURL"
            :get-preview-url="File.getPreviewURL"
            :register-preview-url="File.registerPreviewURL"
            :preview-max-width="600"
            :preview-max-height="1200">
        </form-element>

        <form-element type="md-textarea" name="description" :label="$t('fields.description.label')" :placeholder="$t('fields.description.placeholder')">
        </form-element>

        <component :is="type + '-form'"></component>

        <form-element
            type="form-file"
            :label="$t('fields.attachments')"
            name="attachments"
            style="flex: 1; min-width: 180px;"
            ref="attachments"
            multiple
            :get-url="File.getURL">
        </form-element>

        <div slot="leftButtons" style="flex: 1;">
          <md-checkbox v-if="id === null" :value="personal" @click.native="personal = !personal">{{$t(type + '.personal')}}</md-checkbox>
        </div>
        <div slot="centerButtons" style="width: 24px;"></div>
      </card-form>
    </div>
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
  import Avatar from '../../Avatar';
  import BetterElement from '../../form/BetterElement';

  const components = { CardForm, Avatar, BetterElement };

  /* eslint-disable global-require, import/no-dynamic-require */
  Object.keys(Config.resources).forEach((resource) => {
    components[resource + '-form'] = require('./' + resource + '/Form');
  });

  export default {
    mixins: [mixin],
    props: ['organization', 'permissions'],
    components,
    data() {
      return {
        auth,
        type: undefined,
        personal: false,
        id: undefined,
        item: null,
        File
      };
    },
    beforeDestroy() {
      Bus.$emit('resource-form-destroy');
    },
    watch: {
      $route: {
        immediate: true,
        handler(route) {
          this.personal = !!route.params.personal;
          this.type = route.params.type;
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
        Bus.$emit('resource-form-' + (this.id ? 'edit' : 'create'), snapshot.key, this.$refs.form.values);
        this.item = item;
        return item;
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
        if (!this.id) {
          let path = '/' + this.organization.key + '/' + this.type;
          if (this.personal) {
            path += '/personal';
          }
          path += '/' + this.$refs.form.firebaseRef.key;
          this.$router.replace(path);
        }
      },
      saveFiles(beforeSave, progress) {
        const ref = Firebase.storage().ref();
        ['image', 'attachments'].forEach((field) => {
          this.$refs[field].$refs.el.save((file) => {
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
  .resource .md-card {
    max-width: 616px;
    .resource-title textarea {
      font-size: 24px;
    }
    .resource-subtitle textarea {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.54);
    }

    .md-input-container.md-input-inline {
      background: #fff;
      padding: 0;
      min-height: 0;
      margin: 6px 0 0;
      &:after {
        opacity: 0;
      }
      &:hover,
      &.md-input-focused {
        margin-top: -6px;
        padding-top: 12px;
        &:after {
          opacity: 1;
        }
      }
    }
  }
</style>