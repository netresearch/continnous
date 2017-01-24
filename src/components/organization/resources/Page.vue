<template>
  <resource-list
      :title="$tc('resources.' + type, 2)"
      :organization="organization"
      :permissions="permissions"
      :type="type"
      :trash="trash"
      :items="items"
      :personal="personal"
      trash-enabled
  >
    <md-button
        slot="buttons"
        v-for="(name, path) in {'': organization.name + ' ' + $tc('resources.' + type, 2), 'personal': $t('resources.personal_' + type)}"
        @click="$router.push('/' + organization.key + '/' + type + (path ? '/' + path : ''))"
        v-if="permissions[(path ? path + '_' : '') + type].read || permissions[(path ? path + '_' : '') + type].write"
        :class="{'router-link-active': path === '' && !personal || path !== '' && personal}">
      {{name}}
    </md-button>

    <router-view v-if="type" :organization="organization" :type="type"></router-view>
  </resource-list>
</template>

<script>
  import sortBy from 'sort-by';
  import mixin from './mixin';
  import ResourceList from './List';

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
        trash: false
      };
    },
    watch: {
      $route: {
        immediate: true,
        handler(route) {
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
        this.itemsRef = this.getFirebaseRef(this.trash)
          .orderByChild(this.sort)['limitTo' + (this.order === 'desc' ? 'Last' : 'First')](100);
        this.items = [];
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