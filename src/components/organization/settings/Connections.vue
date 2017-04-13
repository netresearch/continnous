<template>
  <div>
    <p class="md-caption">{{$tc('connections.title', 2)}}</p>
    <md-card>
      <md-card-content>
        <md-list v-if="connectors && organization.connections">
          <md-list-item v-for="(config, key) in organization.connections">
            <span><strong>{{config.title}}</strong> <span class="md-caption">{{connectors[config.type].label}}</span></span>
            <md-button class="md-icon-button" @click.native="current = key">
              <md-icon>edit</md-icon>
            </md-button>
          </md-list-item>
        </md-list>
        <md-button @click.native="current = '{new}'">{{$t('connections.add')}}</md-button>
      </md-card-content>
    </md-card>
    <dialog-form
      v-if="current"
      ref="form"
      :firebase-path="'/organizations/' + organization.key + '/connections/' + current"
      firebase-bind
      @saved="current = loginCanceled = undefined;"
      @closed="current = loginCanceled = undefined"
      @before-save="testConnection"
    >
      <template scope="form">
        <form-element
            type="md-select"
            name="type"
            :label="$t('connections.type')"
            :placeholder="$t('connections.typePlaceholder')"
            :disabled="!!form.values.type"
        >
          <md-option v-for="(connector, type) in connectors" :value="type">{{connector.label}}</md-option>
        </form-element>
        <form-element
          type="md-input"
          name="title"
          :label="$t('fields.title')"
          v-if="form.values.type"
          validate="required"
        ></form-element>
        <component ref="connectionForm" v-if="form.values.type" :is="connectors[form.values.type].configurationForm"></component>
        <p class="error" v-if="loginCanceled">{{$t('connections.loginRequired')}}</p>
      </template>
    </dialog-form>
  </div>
</template>

<script>
  import Connectors from '../../../connectors';
  import DialogForm from '../../form/Dialog';

  export default {
    props: ['organization'],
    components: {
      DialogForm
    },
    data() {
      return {
        connectors: undefined,
        current: undefined,
        loginCanceled: undefined
      };
    },
    created() {
      Connectors.loadAll().then((connectors) => {
        this.connectors = connectors;
      });
    },
    methods: {
      testConnection(promises) {
        this.loginCanceled = undefined;
        if (this.$refs.connectionForm.test) {
          const values = this.$refs.form.values;
          const Connector = this.connectors[values.type];
          const connection = new Connector(values);
          promises.push(
            this.$refs.connectionForm.test(connection)
              .catch((e) => {
                if (!e) {
                  this.loginCanceled = true;
                }
                return Promise.reject(e);
              })
          );
        }
      }
    }
  };
</script>