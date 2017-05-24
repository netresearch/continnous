<template>
  <div>
    <p class="md-caption">{{$t('organization.info')}}</p>
    <card-form
        v-model="organization"
        :firebase-path="'/organizations/' + organization.key"
        :defaults="{title: organization.name + ' ' + $t('thisPlatform'), visionTitle: $t('vision.defaultTitle'), missionTitle: $t('mission.defaultTitle')}"
    >
      <form-element type="md-input" required name="name" :label="$t('name')"></form-element>
      <form-element type="md-input" required name="title" :label="$t('title')"></form-element>
      <template v-for="key in ['vision', 'mission']">
        <form-element
            type="md-input"
            :name="key + 'Title'"
            :label="$t(key + '.title')"
            :placeholder="$t(key + '.placeholder')"
            :validate="{minLength: 2, required: true}"
        ></form-element>
        <form-element
            type="md-textarea"
            :name="key"
            :label="$t(key + '.label')"
            :placeholder="$t(key + '.placeholder')"
        ></form-element>
      </template>
    </card-form>
    <p class="md-caption">{{$t('theme')}}</p>
    <card-form @saved="onThemeSaved" v-model="organization" :firebase-path="'/organizations/' + organization.key">
      <form-element type="form-theme" name="theme" ref="theme" naked>
      </form-element>
      <md-button slot="secondaryButtons" @click.native="$refs.theme.$refs.el.resetToDefaults()" class="md-dense">{{$t('actions.resetToDefaults')}}</md-button>
    </card-form>
    <p class="md-caption">{{$t('settings.icons')}}</p>
    <card-form
        :value="organization"
        :firebase-path="'/organizations/' + organization.key"
    >
      <form-element
          type="form-file"
          v-for="key in ['icon', 'favicon']"
          :accept="'image/png' + (key === 'favicon' ? ',image/vnd.microsoft.icon,image/x-icon' : '')"
          :name="key"
          :label="$t('settings.fields.' + key + '.label')"
      ></form-element>
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
      onThemeSaved() {
        /* global document */
        document.location.reload();
      }
    }
  };
</script>