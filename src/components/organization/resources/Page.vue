<template>
  <div class="scroll-container">
    <md-toolbar class="md-dense">
      <h2 class="md-title">{{$tc('resources.' + type, 2)}}</h2>
    </md-toolbar>
    <md-toolbar class="md-dense md-nav-bar">
      <md-button
          v-for="(name, path) in {'': organization.name + ' ' + $tc('resources.' + type, 2), 'personal': $t('resources.personal_' + type)}"
          @click="$router.push('/' + organization.key + '/' + type + (path ? '/' + path : ''))"
          v-if="permissions[(path ? path + '_' : '') + type].read || permissions[(path ? path + '_' : '') + type].write"
          :class="{'router-link-active': path === '' && !personal || path !== '' && personal}">
        {{name}}
      </md-button>
      <div style="flex: 1"></div>
      <md-button class="md-icon-button" @click="masonry = !masonry">
        <md-icon>{{'view_' + (masonry ? 'stream' : 'quilt')}}</md-icon>
      </md-button>
      <md-button @click="$router.push('/' + organization.key + '/' + type + (personal ? '/personal' : '') + (trash ? '' : '/trash'))" :class="{'md-contrast': trash}">
        <md-icon>delete</md-icon>
        <span>{{$t('trash')}}</span>
      </md-button>
    </md-toolbar>

    <router-view v-if="type" :organization="organization" :type="type"></router-view>

    <div class="scroll-content">
      <resource-list :items="items" :masonry="masonry">
        <template scope="list">
          <resource-item
              :item="list.item"
              :trash="trash"
              :permissions="permissions"
              :type="type"
              :organization="organization"
              @toggleTrash="toggleTrash"
          ></resource-item>
        </template>
      </resource-list>
    </div>
  </div>
</template>

<script>
  import sortBy from 'sort-by';
  import Firebase from '../../../firebase';
  import auth from '../../../auth';
  import mixin from './mixin';
  import ResourceList from './List';
  import ResourceItem from './Item';

  export default {
    mixins: [mixin],
    components: { ResourceList, ResourceItem },
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
        trash: false,
        masonry: true
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
      getFirebaseRef(trash, id) {
        return Firebase.database().ref(
          '/' + (trash ? 'trash' : 'resources')
          + '/organizations/' + this.organization.key
          + '/' + (this.personal ? auth.user.uid : 'organization')
          + '/' + this.type
          + (id ? '/' + id : '')
        );
      },
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
      toggleTrash(item) {
        this.getFirebaseRef(!this.trash, item.id)
          .set(this.prepareItemForFirebase(item))
          .then(() => {
            this.getFirebaseRef(this.trash, item.id).remove();
          });
      },
    }
  };
</script>