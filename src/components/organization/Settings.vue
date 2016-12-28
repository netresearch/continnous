<template>
  <div>
    <md-toolbar class="md-dense">
      <h2 class="md-title">{{$t('settings')}}</h2>
    </md-toolbar>
    <p class="md-caption">{{$t('organization.info')}}</p>
    <md-card>
      <md-card-content>
        <md-input-container :class="{'md-input-invalid': this.changes.hasOwnProperty('name') && this.changes.name.length < 2}">
          <label>{{$t('name')}}</label>
          <md-input required :value="organization.name" @change="onChange('name', $event)"></md-input>
        </md-input-container>
        <md-input-container v-for="key in ['vision', 'mission']">
          <label>{{$t(key + '.label')}}</label>
          <md-textarea :value="organization[key]" :placeholder="$t(key + '.placeholder')" @change="onChange(key, $event)"></md-textarea>
        </md-input-container>
      </md-card-content>
      <md-card-actions>
        <md-button @click="save('name|vision|mission')" class="md-primary md-raised" :disabled="!hasChanged('name|vision|mission') || (changes.hasOwnProperty('name') && changes.name.length < 2)">{{$t('actions.save')}}</md-button>
        <span style="flex: 1"></span>
      </md-card-actions>
      <md-message :status="saved['name|vision|mission']"></md-message>
    </md-card>
    <p class="md-caption">{{$t('theme')}}</p>
    <md-card>
      <md-card-content>
        <theme ref="theme" :value="organization.theme" @input="onChange('theme', $event)"></theme>
      </md-card-content>
      <md-card-actions>
        <md-button @click="save('theme')" class="md-primary md-raised" :disabled="!changes.theme">{{$t('actions.save')}}</md-button>
        <md-button @click="$refs.theme.setValue(organization.theme); $delete(changes, 'theme')" :disabled="!changes.theme">{{$t('actions.reset')}}</md-button>
        <span style="flex: 1"></span>
        <md-button @click="$refs.theme.resetToDefaults()" class="md-dense">{{$t('actions.resetToDefaults')}}</md-button>
      </md-card-actions>
      <md-message :status="saved.theme"></md-message>
    </md-card>
  </div>
</template>

<script>
  import Firebase from 'firebase';
  import Theme from './settings/Theme';

  export default {
    props: ['organization'],
    components: {
      Theme
    },
    data() {
      return {
        changes: {},
        saved: {}
      };
    },
    methods: {
      onChange(key, value) {
        const present = this.organization.hasOwnProperty(key) ? this.organization[key] : '';
        if (JSON.stringify(present) !== JSON.stringify(value)) {
          this.$set(this.changes, key, value);
        } else if (this.changes.hasOwnProperty(key)) {
          this.$delete(this.changes, key);
        }
      },
      hasChanged(keysString) {
        const keys = keysString.split('|');
        for (let i = 0, l = keys.length; i < l; i++) {
          if (this.changes.hasOwnProperty(keys[i])) {
            return true;
          }
        }
        return false;
      },
      save(keysString) {
        const keys = keysString.split('|');
        const updates = {};
        const changedKeys = [];
        keys.forEach((key) => {
          if (this.changes.hasOwnProperty(key)) {
            updates['/organizations/' + this.organization.key + '/' + key] = this.changes[key];
            changedKeys.push(key);
          }
        });

        if (Object.keys(updates).length) {
          this.$set(this.saved, keysString, 0);
          Firebase.database().ref().update(updates).then(
            () => {
              this.$set(this.saved, keysString, 1);
              changedKeys.forEach((key) => {
                this.$delete(this.changes, key);
              });
              if (keys.indexOf('theme') > -1) {
                /* global document */
                document.location.reload();
              }
            },
            () => {
              this.$set(this.saved, keysString, -1);
            }
          );
        }
      }
    }
  };
</script>