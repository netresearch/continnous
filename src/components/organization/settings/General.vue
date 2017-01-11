<template>
  <div>
    <p class="md-caption">{{$t('organization.info')}}</p>
    <card-form v-model="organization" :validate="{name: validateName}" :firebase-path="'/organizations/' + organization.key">
      <template scope="form">
        <form-element name="name" :label="$t('name')">
          <md-input required :value="form.values.name"></md-input>
        </form-element>
        <form-element name="title" :label="$t('title')">
          <md-input required :value="form.values.title || form.values.name + ' ' + $t('thisPlatform')"></md-input>
        </form-element>
        <form-element v-for="key in ['vision', 'mission']" :name="key" :label="$t(key + '.label')">
          <md-textarea :placeholder="$t(key + '.placeholder')" :value="form.values[key]"></md-textarea>
        </form-element>
      </template>
    </card-form>
    <p class="md-caption">{{$t('theme')}}</p>
    <card-form v-model="organization" :firebase-path="'/organizations/' + organization.key">
      <template scope="form">
        <form-element name="theme" bla="blubb" naked>
          <theme :value="form.values.theme" ref="theme"></theme>
        </form-element>
      </template>
      <md-button slot="secondaryButtons" @click="$refs.theme.resetToDefaults()" class="md-dense">{{$t('actions.resetToDefaults')}}</md-button>
    </card-form>
  </div>
</template>

<script>
  import Theme from './Theme';
  import CardForm from '../../form/Card';

  export default {
    props: ['organization'],
    components: {
      Theme,
      CardForm
    },
    methods: {
      validateName(value) {
        return typeof value === 'string' && value.length > 2;
      }
    }
  };
</script>