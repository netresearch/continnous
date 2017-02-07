<template>
  <div :class="['scroll-container', 'resource', 'resource-' + (this.id ? 'edit' : 'create')]">
    <md-toolbar class="md-dense">
      <h2 class="md-title">{{$tc('resources.' + type, 2)}}</h2>
    </md-toolbar>
    <base-form
        class="scroll-container-hgroup"
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
        :disabled="!mayEdit">
      <template v-if="item">
        <div class="scroll-content">
          <avatar :uid="item.creator || auth.user.uid" :organization="organization"></avatar>
        </div>
        <div class="scroll-content resources-card-form-container">
          <resource-main :is-new="!id" :type="type"></resource-main>
        </div>
        <div class="scroll-content">
          <form-button action="save" class="md-primary"></form-button>
          <form-button action="reset"></form-button>
        </div>
      </template>
    </base-form>
  </div>
</template>

<script>
  import BaseForm from '../../form/Base';
  import FormButton from '../../form/Button';
  import auth from '../../../auth';
  import mixin from './mixin';
  import Firebase from '../../../firebase';
  import Avatar from '../../Avatar';
  import ResourceMain from './detail/Main';

  export default {
    mixins: [mixin],
    props: ['organization', 'permissions'],
    components: { BaseForm, Avatar, ResourceMain, FormButton },
    data() {
      return {
        auth,
        type: undefined,
        personal: false,
        id: undefined,
        item: null,
        mayEdit: false
      };
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
        this.item = item;
        this.mayEdit = !this.id || item.creator === this.auth.user.uid;
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
        this.$refs.form.elements.filter(element => element.type === 'form-file').forEach((element) => {
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
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resources-card-form-container {
    flex-grow: 2 !important;
    min-width: 300px;
    max-width: 632px;
  }
  .resource .md-card {
    max-width: 616px;
  }
</style>