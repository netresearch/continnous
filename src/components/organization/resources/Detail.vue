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
      <template scope="form">
        <div class="scroll-content resources-detail-info-container">
          <resource-info v-if="item && id" :type="type" :organization="organization" :personal="personal" :item="item"></resource-info>
          <div v-if="!id">
            <p class="md-caption">
              <md-icon>thumb_up</md-icon>
              <span v-html="$t('detail.motivation', {firstName: auth.user.displayName.split(' ').shift(), displayName: auth.user.displayName})"></span>
            </p>
            <p class="md-caption" style="margin-left: 22px;">
              {{$t('detail.readStatementsHint')}}
            </p>
            <template v-for="(icon, key) in {vision: 'flare', mission: 'navigation'}">
              <p class="md-caption">
                <md-icon>{{icon}}</md-icon>
                <span>
                  <strong>{{organization[key + 'Title'] || $t(key + '.defaultTitle')}}</strong><br>
                  {{organization[key]}}
                </span>
              </p>
            </template>
          </div>
        </div>
        <div class="scroll-content resources-card-form-container">
          <resource-main :is-new="!id" :type="type"></resource-main>
        </div>
        <div class="scroll-content resources-detail-comments-container">
          <div class="scroll-container">
            <template v-if="mayEdit">
              <template v-if="!id">
                <p class="md-caption">
                  <md-icon>info_outline</md-icon>
                  <span v-html="$t('detail.whatsAhead' + (personal ? 'Personal' : ''))"></span>
                </p>
                <md-checkbox v-model="personal" style="margin: 0 0 16px 22px">{{$t(type + '.personal')}}</md-checkbox>
              </template>
              <resource-publish-control :is-new="!id" :organization="organization"></resource-publish-control>
            </template>
            <template v-if="item && id">
              <hr v-if="mayEdit">
              <resource-timeline class="scroll-content" :type="type" :organization="organization" :personal="personal" :item="item"></resource-timeline>
            </template>
          </div>
        </div>
      </template>
    </base-form>
  </div>
</template>

<script>
  import BaseForm from '../../form/Base';
  import auth from '../../../auth';
  import mixin from './mixin';
  import Firebase from '../../../firebase';
  import ResourceMain from './detail/Main';
  import ResourceInfo from './detail/Info';
  import ResourcePublishControl from './detail/PublishControl';
  import ResourceTimeline from './detail/Timeline';

  export default {
    mixins: [mixin],
    props: ['organization', 'permissions'],
    components: { BaseForm, ResourceMain, ResourceInfo, ResourcePublishControl, ResourceTimeline },
    data() {
      return {
        auth,
        type: undefined,
        personal: false,
        id: undefined,
        mayEdit: false,
        item: undefined
      };
    },
    watch: {
      $route: {
        immediate: true,
        handler(route) {
          this.personal = !!route.params.personal;
          this.type = route.params.type;
          this.id = route.params.id || null;
          if (this.$refs.form) {
            this.$refs.form.reset(true);
          }
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
            this.organization.journal.addEntry(this.type, this.personal, this.id, 'update', keys);
          } else {
            this.organization.journal.addEntry(this.type, this.personal, ref.key, 'create');
          }
        }
        if (!this.id) {
          this.$router.replace(this.getUrlPath(this.$refs.form.firebaseRef.key));
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
  .resources-detail-info-container,
  .resources-detail-comments-container {
    display: flex;
    flex-flow: row;
    &.resources-detail-info-container {
      justify-content: flex-end;
    }
    > div {
      width: 50%;
      min-width: 200px;
    }
  }
  .resource-detail-timeline {
    padding: 0 16px 0 0 !important;
    margin-right: -16px;
  }
</style>