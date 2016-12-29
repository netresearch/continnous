<template>
  <div>
    <p class="md-caption">{{$t('organization.info')}}</p>
    <md-card>
      <md-card-content>
        <md-input-container :class="{'md-input-invalid': this.errors.name}">
          <label>{{$t('name')}}</label>
          <md-input required :value="values.name" @change="onChange('name', $event)"></md-input>
        </md-input-container>
        <md-input-container v-for="key in ['vision', 'mission']">
          <label>{{$t(key + '.label')}}</label>
          <md-textarea :value="values[key]" :placeholder="$t(key + '.placeholder')" @change="onChange(key, $event)"></md-textarea>
        </md-input-container>
      </md-card-content>
      <md-card-actions>
        <md-button @click="save('name|vision|mission')" class="md-primary md-raised" :disabled="!hasChanged('name|vision|mission') || this.errors.name">{{$t('actions.save')}}</md-button>
        <md-button @click="reset('name|vision|mission')" :disabled="!hasChanged('name|vision|mission', true)">{{$t('actions.reset')}}</md-button>
        <span style="flex: 1"></span>
      </md-card-actions>
      <md-message :status="saved['name|vision|mission']"></md-message>
    </md-card>
    <p class="md-caption">{{$t('theme')}}</p>
    <md-card>
      <md-card-content>
        <theme ref="theme" :value="values.theme" @input="onChange('theme', $event)"></theme>
      </md-card-content>
      <md-card-actions>
        <md-button @click="save('theme')" class="md-primary md-raised" :disabled="!hasChanged('theme')">{{$t('actions.save')}}</md-button>
        <md-button @click="reset('theme')" :disabled="!hasChanged('theme')">{{$t('actions.reset')}}</md-button>
        <span style="flex: 1"></span>
        <md-button @click="$refs.theme.resetToDefaults()" class="md-dense">{{$t('actions.resetToDefaults')}}</md-button>
      </md-card-actions>
      <md-message :status="saved.theme"></md-message>
    </md-card>
  </div>
</template>

<script>
  import Theme from './Theme';
  import Base from './base';

  export default {
    extends: Base,
    props: ['organization'],
    components: {
      Theme
    },
    validate: {
      name(value) {
        return typeof value === 'string' && value.length > 2;
      }
    },
    objectPath: 'organization',
    firebasePath() {
      return '/organizations/' + this.organization.key;
    },
    data() {
      return {
        objectPath: 'organization'
      };
    }
  };
</script>