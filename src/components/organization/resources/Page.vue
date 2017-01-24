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
        orderBy: 'updated',
        order: 'desc',
        trash: false
      };
    },
    watch: {
      $route: {
        immediate: true,
        handler(route) {
          const type = route.params.type;
          const trash = !!route.params.trash;
          let personal = !!route.params.personal;
          const personalAllowed = this.permissions['personal_' + type].read || this.permissions['personal_' + type].write;
          const organizationAllowed = this.permissions[type].read || this.permissions[type].write;
          if (personal && !personalAllowed && organizationAllowed) {
            personal = false;
          } else if (!personal && personalAllowed && !organizationAllowed) {
            personal = true;
          }
          if (this.items === undefined
            || this.type !== type || this.trash !== trash || this.personal !== personal) {
            this.type = type;
            this.trash = trash;
            this.personal = personal;
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
          .orderByChild('updated')['limitTo' + (this.order === 'desc' ? 'Last' : 'First')](100);
        this.items = [];
        this.itemsRef.on('child_added', (item) => {
          this.items.push(this.createItem(item.key, item.val()));
          this.items.sort(sortBy((this.order === 'desc' ? '-' : '') + this.orderBy));
        });
        this.itemsRef.on('child_changed', (item) => {
          for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === item.key) {
              Object.assign(this.items[i], this.createItem(item.key, item.val()));
            }
          }
        });
        this.itemsRef.on('child_moved', () => {
          this.items.sort(sortBy((this.order === 'desc' ? '-' : '') + this.orderBy));
        });
        this.itemsRef.on('child_removed', (item) => {
          this.items = this.items.filter(presentItem => presentItem.id !== item.key);
        });
      },
    }
  };
</script>