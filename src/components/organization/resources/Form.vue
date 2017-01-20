<template>
  <div>
    <dialog-form
        class="resources-dialog-form"
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
    >
      <template slot="title" scope="form">
        <form-element name="title" md-inline :label="$t(type + '.title.placeholder')">
          <md-input :value="form.values.title"></md-input>
        </form-element>
      </template>

      <template scope="form">
        <div class="resources-dialog-form-content">
          <form-element name="subtitle" :label="$t('fields.subtitle.label')">
            <md-input :value="form.values.subtitle" :placeholder="$t('fields.subtitle.placeholder')"></md-input>
          </form-element>
          <form-element name="description" :label="$t('fields.description.label')">
            <md-textarea :value="form.values.description" :placeholder="$t('fields.description.placeholder')"></md-textarea>
          </form-element>

          <md-layout md-gutter="24">
            <md-layout>
              <form-element :label="$t('fields.image')" name="image" style="flex: 1; min-width: 180px; max-width: 100%;">
                <form-file gallery accept="image/png,image/jpeg,image/jpg,image/gif" :value="form.values.image"></form-file>
              </form-element>
            </md-layout>
            <md-layout>
              <form-element :label="$t('fields.attachments')" name="attachments" style="flex: 1; min-width: 180px;">
                <form-file multiple :value="form.values.attachments"></form-file>
              </form-element>
            </md-layout>
          </md-layout>
        </div>
      </template>

      <div slot="leftButtons" style="flex: 1;">
        <md-checkbox v-if="id === null" v-model="personal">{{$t(type + '.personal.label')}}</md-checkbox>
      </div>
      <div slot="centerButtons" style="width: 24px;"></div>
    </dialog-form>
  </div>
</template>

<script>
  import DialogForm from '../../form/Dialog';
  import auth from '../../../auth';
  import mixin from './mixin';

  export default {
    mixins: [mixin],
    props: ['organization', 'type'],
    components: { DialogForm },
    data() {
      return {
        auth,
        personal: false,
        id: undefined,
        item: null
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
        return this.createItem(snapshot.key, snapshot.val());
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
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resources-dialog-form-content {
    width: 548px;
    max-width: 100%;
  }
</style>