<template>
  <div>
    <md-toolbar class="md-dense">
      <h2 class="md-title">{{$t('settings')}}</h2>
    </md-toolbar>
    <p class="md-caption">{{$t('organization.info')}}</p>
    <md-card>
      <md-card-content>
        <md-input-container>
          <label>{{$t('name')}}</label>
          <md-input :value="organization.name"></md-input>
        </md-input-container>
        <md-input-container v-for="key in ['vision', 'mission']">
          <label>{{$t(key + '.label')}}</label>
          <md-textarea :value="organization[key]" :placeholder="$t(key + '.placeholder')"></md-textarea>
        </md-input-container>
      </md-card-content>
    </md-card>
    <p class="md-caption">{{$t('theme')}}</p>
    <md-card>
      <md-card-content>
        <theme ref="theme" :value="organization.theme" @input="onChange('theme', $event)"></theme>
      </md-card-content>
      <md-card-actions>
        <md-button class="md-primary md-raised" :disabled="!changes.theme">{{$t('actions.save')}}</md-button>
        <md-button :disabled="!changes.theme" @click="$refs.theme.setValue(organization.theme); $delete(changes, 'theme')">{{$t('actions.reset')}}</md-button>
        <span style="flex: 1"></span>
        <md-button @click="$refs.theme.resetToDefaults()" class="md-dense">{{$t('actions.resetToDefaults')}}</md-button>
      </md-card-actions>
    </md-card>
  </div>
</template>

<script>
  import Theme from './settings/Theme';

  export default {
    props: ['organization'],
    components: {
      Theme
    },
    data() {
      return {
        changes: {}
      };
    },
    methods: {
      onChange(key, value) {
        this.$set(this.changes, key, value);
      }
    }
  };
</script>