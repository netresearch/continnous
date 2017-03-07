<template>
  <div class="resource-inline-list">
    <md-input-container v-if="search">
      <md-input @input="doSearch" :placeholder="$t('search')"></md-input>
    </md-input-container>
    <md-list class="md-dense">
      <md-list-item
          v-for="item in items"
          @click.native="selectable ? $emit('selected', item) : null"
          :href="link ? getUrl(item.id, personal, false, item.resource) : ''"
          class="resource-inline-list-item"
      >
        <md-icon>{{resources[item.resource].icon}}</md-icon>
        <div>{{item.title}}</div>
      </md-list-item>
    </md-list>
  </div>
</template>

<script>
  import mixin from './mixin';
  import Config from '../../../models/Config';
  import Flashlight from '../../../models/Flashlight';

  export default {
    mixins: [mixin],
    props: {
      entries: [Array, Object],
      type: [Array, String],
      selectable: Boolean,
      all: Boolean,
      personal: Boolean,
      organization: Object,
      search: Boolean,
      permissions: Object,
      link: Boolean
    },
    data() {
      return {
        items: [],
        resources: Config.resources
      };
    },
    created() {
      this.loadItems();
    },
    computed: {
      types() {
        if (this.type && this.type.length) {
          return typeof this.type === 'string' ? [this.type] : this.type;
        }
        return Object.keys(this.resources);
      },
      ids() {
        if (this.$isArray(this.entries)) {
          return this.entries.map(entry => (typeof entry === 'string' ? entry : entry.id));
        } else if (this.entries) {
          return Object.keys(this.entries);
        }
        return [];
      }
    },
    watch: {
      all: 'loadItems',
      entries: 'loadItems',
      personal: 'loadItems',
      types: 'loadItems'
    },
    methods: {
      doSearch(sword) {
        if (!this.flashlight) {
          this.flashlight = new Flashlight(this.organization, this.permissions);
        }
        this.flashlight.search({ q: sword }, ...this.types).then((results) => {
          this.items = [];
          results.forEach((result) => {
            result.hits.forEach((hit) => {
              /* eslint-disable no-underscore-dangle */
              this.items.push(this.createItem(hit._id, hit._source, result.resource));
            });
          });
        });
      },
      loadItems() {
        this.$nextTick(() => {
          if (this.refs) {
            this.refs.forEach((ref) => { ref.off('value'); });
          }
          this.refs = [];
          this.items = [];

          const handleMissingIds = (ids) => {
            let value;
            if (this.$isArray(this.value)) {
              value = this.value.filter(
                entry => (typeof entry === 'string' && ids.indexOf(entry) < 0) || ids.indexOf(entry.id) < 0
              );
            } else {
              value = Object.assign({}, this.value);
              ids.forEach((id) => {
                delete value[id];
              });
            }
            this.$emit('change', value);
          };

          if (this.all) {
            this.types.forEach((type) => {
              const ref = this.getFirebaseRef('resources', undefined, this.personal, type);
              this.refs.push(ref);
              ref.on('value', (sn) => {
                this.items = this.items.filter(item => item.resource !== type);
                const ids = [];
                const missingIds = [];
                sn.forEach((csn) => {
                  ids.push(csn.key);
                  this.items.push({ id: csn.key, resource: type, title: csn.val().title });
                });
                this.ids.forEach((id) => {
                  if (ids.indexOf(id) < 0) {
                    missingIds.push(id);
                  }
                });
                if (missingIds.length) {
                  handleMissingIds(ids);
                }
              });
            });
          } else if (this.entries) {
            const createRef = (type, id) => {
              if (!type) {
                throw new Error('Missing type for item ' + id);
              }
              const ref = this.getFirebaseRef('resources', id, this.personal, type).child('title');
              this.refs.push(ref);
              ref.on('value', (sn) => {
                if (sn.val()) {
                  this.items.push({ id, resource: type, title: sn.val() });
                } else {
                  handleMissingIds([id]);
                }
              });
            };
            const singleType = this.types.length === 1 ? this.types[0] : null;
            if (this.$isArray(this.entries)) {
              this.entries.forEach((entry) => {
                if (typeof entry === 'string') {
                  createRef(singleType, entry);
                } else {
                  createRef(entry.resource || singleType, entry.id);
                }
              });
            } else {
              Object.keys(this.entries).forEach((id) => {
                createRef(this.entries[id].resource || singleType, this.entries[id].id || id);
              });
            }
          }
        });
      }
    }
  };
</script>