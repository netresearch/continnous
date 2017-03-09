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
        <div>
          <router-link v-if="link" :to="getUrlPath(item)">{{item.title}}</router-link>
          <span v-else>{{item.title}}</span>
          <md-icon class="md-warn md-small" v-if="item.personal">
            lock_outline
            <md-tooltip>
              {{$t(item.resource + '.this')}} {{$t('isPersonal')}}
            </md-tooltip>
          </md-icon>
          <md-icon class="md-warn md-small" v-if="item.archive">
            archive
            <md-tooltip>
              {{$t(item.resource + '.this')}} {{$t('isArchived')}}
            </md-tooltip>
          </md-icon>
        </div>
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
      entries: Array,
      type: [Array, String],
      selectable: Boolean,
      clearable: Boolean,
      all: Boolean,
      personal: Boolean,
      archive: Boolean,
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
        if (this.entries) {
          return this.entries.map(entry => (typeof entry === 'string' ? entry : entry.id));
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
        this.flashlight.suggest(sword, true, ...this.types).then((results) => {
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
            this.$emit('change',
              this.ids.filter(id => ids.indexOf(typeof id === 'string' ? id : id.id) < 0)
            );
          };

          if (this.all && this.load) {
            this.loading = true;
            this.types.forEach((resource) => {
              [this.personal, !this.personal].forEach((personal) => {
                const ref = this.getFirebaseRef('resources', undefined, personal, resource)
                    .orderByChild('updated').limitToLast(10);
                this.refs.push(ref);
                ref.on('value', (sn) => {
                  this.loading = false;
                  this.items = this.items.filter(
                      item => item.resource !== resource ||
                        (item.resource === resource && item.personal !== personal)
                  );
                  const ids = [];
                  const missingIds = [];
                  sn.forEach((csn) => {
                    ids.push(csn.key);
                    if (this.ids.indexOf(csn.key) < 0) {
                      this.items.push({ id: csn.key, resource, personal, title: csn.val().title });
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
            });
          } else if (this.entries && !this.search) {
            const singleType = this.types.length === 1 ? this.types[0] : null;
            this.entries.forEach((entry) => {
              const item = Object.assign({
                resource: singleType,
                title: '...'
              }, typeof entry === 'string' ? { id: entry } : entry);
              if (!item.resource) {
                throw new Error('Missing resource for item ' + item.id);
              }
              if (!this.load) {
                this.items.push(item);
                return;
              }
              const p = item.hasOwnProperty('personal') ? item.personal : this.personal;
              const a = item.hasOwnProperty('archive') ? item.archive : this.archive;
              const args = [[a, p], [!a, p], [a, !p], [!a, !p]];
              const load = (archive, personal) => {
                const next = args.shift();
                if (!this.permissions[(personal ? 'personal_' : '') + item.resource].read) {
                  if (next) {
                    load(...next);
                  }
                  return;
                }
                const ref = this.getFirebaseRef(archive, item.id, personal, item.resource).child('title');
                ref.on('value', (sn) => {
                  if (sn.val()) {
                    this.refs.push(ref);
                    item.title = sn.val();
                    item.personal = personal;
                    item.archive = archive;
                    this.items.push(item);
                  } else {
                    ref.off('value');
                    if (next) {
                      load(...next);
                    } else {
                      handleMissingIds([item.id]);
                    }
                  }
                });
              };
              load(...args.shift());
            });
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