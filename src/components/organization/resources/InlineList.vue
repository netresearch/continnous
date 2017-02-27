<template>
  <md-list class="resource-inline-list md-dense">
    <md-list-item v-for="item in items" @click.native="selectable ? $emit('selected', item) : null" class="resource-inline-list-item">
      <md-icon>{{resources[item.resource].icon}}</md-icon>
      <div>{{item.title}}</div>
    </md-list-item>
  </md-list>
</template>

<script>
  import mixin from './mixin';
  import Config from '../../../models/Config';

  export default {
    mixins: [mixin],
    props: {
      value: [Array, Object],
      type: [Array, String],
      selectable: Boolean,
      all: Boolean,
      personal: Boolean,
      organization: Object
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
        if (this.$isArray(this.value)) {
          return this.value.map(entry => (typeof entry === 'string' ? entry : entry.id));
        } else if (this.value) {
          return Object.keys(this.value);
        }
        return [];
      }
    },
    watch: {
      all: 'loadItems',
      value: 'loadItems',
      personal: 'loadItems',
      types: 'loadItems'
    },
    methods: {
      loadItems() {
        this.$nextTick(() => {
          if (this.refs) {
            this.refs.forEach(ref => ref.off('value'));
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
          } else {
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