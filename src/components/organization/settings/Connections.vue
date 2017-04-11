<template>
  <div>
    <p class="md-caption">Connections</p>
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
        <md-button @click.native="current = '{new}'">Add connector</md-button>
      </md-card-content>
    </md-card>
    <dialog-form
      v-if="current"
      :firebase-path="'/organizations/' + organization.key + '/connections/' + current"
      firebase-bind
      @saved="current = undefined"
      @closed="current = undefined"
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
        ></form-element>
        <component v-if="form.values.type" :is="connectors[form.values.type].configurationForm"></component>
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
        current: undefined
      };
    },
    created() {
      Connectors.loadAll().then((connectors) => {
        this.connectors = connectors;
      });
    },
  };
</script>