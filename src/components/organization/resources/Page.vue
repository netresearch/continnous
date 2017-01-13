<template>
  <div>
    <md-toolbar class="md-dense">
      <h2 class="md-title">{{$tc(singularType, 2)}}</h2>
    </md-toolbar>
    <md-toolbar class="md-dense md-nav-bar">
      <md-button
          v-for="(name, path) in {'': organization.name + ' ' + $tc(singularType, 2), '/personal': $t('objectives.personal.title')}"
          @click="$router.push('/' + organization.key + '/' + type + path)"
          :class="{'router-link-active': path === '' && !personal || path !== '' && personal}">
        {{name}}
      </md-button>
      <div style="flex: 1"></div>
      <md-button @click="$router.push('/' + organization.key + '/' + type + (personal ? '/personal' : '') + (trash ? '' : '/trash'))" :class="{'md-contrast': trash}">
        <md-icon>delete</md-icon>
        <span>Papierkorb</span>
      </md-button>
    </md-toolbar>

    <router-view :organization="organization" :type="type"></router-view>

    <md-layout md-gutter="16" class="resources-list">
      <md-layout v-for="item in items">
        <md-card>
          <md-card-header>
            <md-card-header-text>
              <div class="md-title">{{item.title}}</div>
              <div class="md-subhead">{{item.description}}</div>
            </md-card-header-text>
            <md-menu v-if="!trash" md-size="4" md-direction="bottom left">
              <md-button class="md-icon-button" md-menu-trigger>
                <md-icon>more_vert</md-icon>
              </md-button>
              <md-menu-content>
                <md-menu-item v-if="permissions[type].write && item.creator === auth.user.uid">
                  <router-link :to="'/' + organization.key + '/' + type + '/' + item.id + '/edit'" exact>
                    <md-icon>create</md-icon>
                    <span>{{$t('actions.edit')}}</span>
                  </router-link>
                </md-menu-item>
                <md-menu-item @selected="toggleTrash(item)" v-if="permissions[type].write && item.creator === auth.user.uid">
                  <md-icon>delete</md-icon>
                  <span>{{$t('actions.delete')}}</span>
                </md-menu-item>
              </md-menu-content>
            </md-menu>
            <md-button v-else @click="toggleTrash(item)" :title="$t('actions.restore')" class="md-icon-button">
              <md-icon>delete_sweep</md-icon>
            </md-button>
          </md-card-header>
          <md-card-content>
            Huhu
          </md-card-content>
        </md-card>
      </md-layout>
    </md-layout>
  </div>
</template>

<script>
  import sortBy from 'sort-by';
  import Firebase from '../../../firebase';
  import auth from '../../../auth';

  export default {
    props: {
      organization: Object,
      permissions: Object,
      type: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        personal: false,
        items: [],
        auth,
        orderBy: 'updated',
        order: 'desc',
        trash: false
      };
    },
    computed: {
      singularType() {
        const l = this.type.length;
        return this.type.substr(-3) === 'ies' ? this.type.substr(0, l - 3) + 'y' : this.type.substr(0, l - 1);
      }
    },
    watch: {
      $route: {
        immediate: true,
        handler(route) {
          this.trash = !!route.params.trash;
          this.personal = !!route.params.personal;
          this.loadItems();
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
          this.items.push(Object.assign({}, item.val(), { id: item.key }));
          this.items.sort(sortBy((this.order === 'desc' ? '-' : '') + this.orderBy));
        });
        this.itemsRef.on('child_changed', (item) => {
          for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].id === item.key) {
              Object.assign(this.items[i], item.val());
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
          .set(item)
          .then(() => {
            this.getFirebaseRef(this.trash, item.id).remove();
          });
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resources-list {
    .md-card {
      width: 100%;
    }
  }
</style>