<template>
  <resource-list
      class="resource-index"
      :type="type"
      :archive="archive"
      :items="items"
      :personal="personal"
      :period="archive ? undefined : period"
      :status="status"
      :sort="sort"
      :order="order"
      archive-enabled
      :personal-enabled="Current.permissions['personal_' + type].read"
  >
    <template slot="title">
      <md-icon>{{Config.resources[type].icon}}</md-icon>
      <h2 class="md-title">{{$tc(type + '.title', 2)}}</h2>
    </template>
    <router-view v-if="type" :type="type"></router-view>
  </resource-list>
</template>

<script>
  import sortBy from 'sort-by';
  import mixin from './mixin';
  import ResourceList from './List';
  import Config from '../../../models/Config';
  import Period from '../../../models/Period';
  import Item from '../../../models/Item';
  import Current from '../../../models/Current';

  export default {
    mixins: [mixin],
    components: { ResourceList },
    data() {
      return {
        type: undefined,
        personal: false,
        items: undefined,
        sort: 'updated',
        order: 'desc',
        archive: false,
        period: undefined,
        status: 0,
        Current,
        Config
      };
    },
    watch: {
      $route: {
        immediate: true,
        handler(route) {
          if ((route.params.id || route.params.create) && this.type) {
            return;
          }
          const p = {
            type: route.params.type || this.type,
            archive: !!route.params.archive,
            personal: !!route.params.personal,
            sort: route.query.sort || this.sort,
            order: route.query.order || this.order,
          };
          const permissions = Current.permissions;
          const personalAllowed = permissions['personal_' + p.type].read || permissions['personal_' + p.type].write;
          const organizationAllowed = permissions[p.type].read || permissions[p.type].write;
          if (p.personal && !personalAllowed && organizationAllowed) {
            p.personal = false;
          } else if (!p.personal && personalAllowed && !organizationAllowed) {
            p.personal = true;
          }
          let load = this.items === undefined;
          ['type', 'archive', 'personal', 'order', 'sort'].forEach((key) => {
            if (p[key] !== this[key]) {
              this[key] = p[key];
              load = true;
            }
          });
          if (this.type && Config.resources[this.type].periodical && !p.archive) {
            const period = Period.getById(route.params.period);
            if (!this.period || this.period.getId() !== period.getId()) {
              this.period = period;
              load = true;
            }
          } else if (this.period) {
            this.period = undefined;
            load = true;
          }
          if (load) {
            this.loadItems();
          }
        }
      }
    },
    methods: {
      loadItems() {
        if (this.itemsRef) {
          this.itemsRef.off('child_added');
          this.itemsRef.off('child_changed');
          this.itemsRef.off('child_moved');
          this.itemsRef.off('child_removed');
        }
        const ref = Item.getFirebaseRef(this.type, this.archive, this.personal);
        if (this.period) {
          this.itemsRef = ref.orderByChild('dueTime')
            .startAt(this.period.start)
            .endAt(this.period.end)
            .limitToLast(100);
        } else {
          this.itemsRef = ref
            .orderByChild(this.sort)[
          'limitTo' + (this.order === 'desc' ? 'Last' : 'First')
            ](100);
        }
        this.items = [];
        this.status = 0;
        this.itemsRef.once('value', () => {
          this.status = 1;
        });
        this.itemsRef.on('child_added', (item) => {
          this.items.push(new Item(this.type, item.key, item.val(), this.archive, this.personal));
          this.items.sort(sortBy((this.order === 'desc' ? '-' : '') + this.sort));
        });
        this.itemsRef.on('child_changed', (item) => {
          for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === item.key) {
              this.items[i].update(item.val());
            }
          }
        });
        this.itemsRef.on('child_moved', () => {
          this.items.sort(sortBy((this.order === 'desc' ? '-' : '') + this.sort));
        });
        this.itemsRef.on('child_removed', (item) => {
          this.items = this.items.filter(presentItem => presentItem.id !== item.key);
        });
      },
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-index {
    > .md-toolbar {
      .md-icon:first-child {
        margin-right: 8px;
      }
    }
  }
</style>