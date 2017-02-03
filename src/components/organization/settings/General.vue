<template>
  <div>
    <p class="md-caption">{{$t('organization.info')}}</p>
    <card-form
        v-model="organization"
        :validate="{name: validateName}"
        :firebase-path="'/organizations/' + organization.key"
        :defaults="{title: organization.name + ' ' + $t('thisPlatform')}"
    >
      <form-element type="md-input" required name="name" :label="$t('name')"></form-element>
      <form-element type="md-input" required name="title" :label="$t('title')"></form-element>
      <form-element
          v-for="key in ['vision', 'mission']"
          type="md-textarea"
          :name="key"
          :label="$t(key + '.label')"
          :placeholder="$t(key + '.placeholder')"
      ></form-element>
    </card-form>
    <p class="md-caption">{{$t('theme')}}</p>
    <card-form @saved="onThemeSaved" v-model="organization" :firebase-path="'/organizations/' + organization.key">
      <form-element type="form-theme" name="theme" ref="theme" naked>
      </form-element>
      <md-button slot="secondaryButtons" @click="$refs.theme.$refs.el.resetToDefaults()" class="md-dense">{{$t('actions.resetToDefaults')}}</md-button>
    </card-form>
  </div>
</template>

<script>
  import CardForm from '../../form/Card';

  export default {
    props: ['organization'],
    components: {
      CardForm
    },
    methods: {
      validateName(value) {
        return typeof value === 'string' && value.length > 2;
      },
      onThemeSaved() {
        /* global document */
        document.location.reload();
      }
    }
  };
</script>