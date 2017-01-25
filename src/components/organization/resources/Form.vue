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
    >
      <template slot="title" scope="form">
        <form-element name="title" md-inline :label="$t(type + '.title')">
          <md-input :value="form.values.title"></md-input>
        </form-element>
      </template>

      <template scope="form">
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