<template>
  <div>
    <dialog-form
        class="form-base-dialog"
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
        <md-checkbox v-if="id === null" v-model="personal">{{$t(type + '.personal.label')}}</md-checkbox>

        <form-element naked name="image">
          <form-file :value="form.values.image"></form-file>
        </form-element>
      </template>
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