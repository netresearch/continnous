<template>
  <div :class="['resource-inline-list', {'resource-inline-link-list': link, 'resource-inline-selectable-list': selectable}]">
    <md-input-container v-if="search">
      <label>{{$t('search')}}</label>
      <md-input @input="doSearch" :placeholder="$t('search')"></md-input>
    </md-input-container>
    <md-progress md-indeterminate v-if="loading"></md-progress>
    <md-list class="md-dense" v-if="items.length">
      <md-list-item
          v-for="item in items"
          @click.native="selectable ? $emit('selected', item) : null"
          class="resource-inline-list-item"
      >
        <md-icon>{{resources[item.resource].icon}}</md-icon>
        <a v-if="link" :href="getHref(item.id, personal, false, item.resource)">{{item.title}}</a>
        <div v-else>{{item.title}}</div>
        <md-button v-if="clearable" class="md-icon-button" @click.native="$emit('clear', item)">
          <md-icon>clear</md-icon>
        </md-button>
      </md-list-item>
    </md-list>
    <p class="md-caption" v-if="loading === false && !items.length">
      {{$t('noMatches')}}
    </p>
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
      clearable: Boolean,
      all: Boolean,
      personal: Boolean,
      organization: Object,
      search: Boolean,
      permissions: Object,
      link: Boolean,
      load: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        items: [],
        resources: Config.resources,
        loading: undefined
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
      types: 'loadItems',
      load: 'loadItems'
    },
    methods: {
      doSearch(sword) {
        if (!this.flashlight) {
          this.flashlight = new Flashlight(this.organization, this.permissions);
        }
        this.loading = true;
        this.flashlight.suggest(sword, ...this.types).then((results) => {
          this.items = [];
          this.loading = false;
          results.forEach((result) => {
            result.hits.forEach((hit) => {
              /* eslint-disable no-underscore-dangle */
              if (this.ids.indexOf(hit._id) < 0) {
                this.items.push(this.createItem(hit._id, hit._source, result.resource));
              }
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

          if (this.all && this.load) {
            this.loading = true;
            this.types.forEach((type) => {
              const ref = this.getFirebaseRef('resources', undefined, this.personal, type);
              this.refs.push(ref);
              ref.on('value', (sn) => {
                this.loading = false;
                this.items = this.items.filter(item => item.resource !== type);
                const ids = [];
                const missingIds = [];
                sn.forEach((csn) => {
                  ids.push(csn.key);
                  if (this.ids.indexOf(csn.key) < 0) {
                    this.items.push({ id: csn.key, resource: type, title: csn.val().title });
                  }
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
          } else if (this.entries && !this.search) {
            const createRef = (type, id, title) => {
              if (!this.load) {
                this.items.push({ id, resource: type, title: title || '...' });
                return;
              }
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
                  createRef(entry.resource || singleType, entry.id, entry.title);
                }
              });
            } else {
              Object.keys(this.entries).forEach((id) => {
                createRef(
                    this.entries[id].resource || singleType,
                    this.entries[id].id || id,
                    this.entries[id].title
                );
              });
            }
          }
        });
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-inline-list {
    .md-button-ghost {
      display: none;
    }
    .md-list-item-container {
      cursor: default;
    }
    &.resource-inline-selectable-list {
      .md-list-item-container {
        cursor: pointer;
      }
    }
  }
</style>