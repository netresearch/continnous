<template>
  <resource-list
      :title="$tc(type + '.title', 2)"
      :organization="organization"
      :permissions="permissions"
      :type="type"
      :trash="trash"
      :items="items"
      :personal="personal"
      :period="trash ? undefined : period"
      :status="status"
      :sort="sort"
      :order="order"
      trash-enabled
  >
    <md-button
        slot="buttons"
        v-for="(name, path) in {'': organization.name + ' ' + $tc(type + '.title', 2), 'personal': $tc(type + '.personal', 2)}"
        @click="$router.push('/' + organization.key + '/' + type + (path ? '/' + path : ''))"
        v-if="permissions[(path ? path + '_' : '') + type].read || permissions[(path ? path + '_' : '') + type].write"
        :class="{'router-link-active': path === '' && !personal || path !== '' && personal}">
      {{name}}
    </md-button>

    <router-view v-if="type" :organization="organization" :type="type" :permissions="permissions"></router-view>
  </resource-list>
</template>

<script>
  import sortBy from 'sort-by';
  import mixin from './mixin';
  import ResourceList from './List';
  import Config from '../../../models/Config';
  import Period from '../../../models/Period';

  export default {
    mixins: [mixin],
    components: { ResourceList },
    props: {
      organization: Object,
      permissions: Object,
    },
    data() {
      return {
        type: undefined,
        personal: false,
        items: undefined,
        sort: 'updated',
        order: 'desc',
        trash: false,
        period: undefined,
        status: 0
      };
    },
    watch: {
      $route: {
        immediate: true,
        handler(route) {
          if (route.params.id && this.type) {
            return;
          }
          const p = {
            type: route.params.type || this.type,
            trash: !!route.params.trash,
            personal: !!route.params.personal,
            sort: route.query.sort || this.sort,
            order: route.query.order || this.order,
          };
          const personalAllowed = this.permissions['personal_' + p.type].read || this.permissions['personal_' + p.type].write;
          const organizationAllowed = this.permissions[p.type].read || this.permissions[p.type].write;
          if (p.personal && !personalAllowed && organizationAllowed) {
            p.personal = false;
          } else if (!p.personal && personalAllowed && !organizationAllowed) {
            p.personal = true;
          }
          let load = this.items === undefined;
          ['type', 'trash', 'personal', 'order', 'sort'].forEach((key) => {
            if (p[key] !== this[key]) {
              this[key] = p[key];
              load = true;
            }
          });
          if (this.type && Config.resources[this.type].periodical && !p.trash) {
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
        const ref = this.getFirebaseRef(this.trash ? 'trash' : 'resources');
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
          this.items.push(this.createItem(item.key, item.val()));
          this.items.sort(sortBy((this.order === 'desc' ? '-' : '') + this.sort));
        });
        this.itemsRef.on('child_changed', (item) => {
          for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === item.key) {
              Object.assign(this.items[i], this.createItem(item.key, item.val()));
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