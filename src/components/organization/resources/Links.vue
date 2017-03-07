<template>
  <div :class="['resource-links', {'resource-links-list-item': subMenu}]">
    <md-menu v-if="permissions[type].write && !apart" md-size="4" :md-offset-x="subMenu ? 60 : 0">
      <md-list-item v-if="subMenu" md-menu-trigger>
        <md-icon>link</md-icon>
        <span v-if="subMenu">Verknüpfen</span>
      </md-list-item>
      <md-button v-else class="md-icon-button" md-menu-trigger><md-icon>link</md-icon></md-button>
      <md-menu-content>
        <md-menu-item v-for="linkConfig in links" @selected="link = linkConfig" v-if="linkConfig.reverse || !linkConfig.exclusive || !item.links || !item.links[linkConfig.resource]">
          <md-icon>{{resources[linkConfig.resource].icon}}</md-icon>
          <span>{{$tc(linkConfig.resource + '.title', 1)}}</span>
        </md-menu-item>
        <slot></slot>
      </md-menu-content>
    </md-menu>
    <template v-if="apart">
      <md-button class="md-icon-button" v-for="linkConfig in links" v-if="linkConfig.apart">
        <md-icon>{{resources[linkConfig.resource].icon}}</md-icon>
      </md-button>
    </template>
    <div class="resource-links-list" v-if="list">
      <div class="resource-detail-link" v-for="link in links">
        <div class="resource-detail-link-title" v-if="link.config.apart">
          {{$tc(link.config.resource + '.title', link.config.exclusive && !link.config.reverse ? 1 : 2)}}
        </div>
        <inline-list
            :organization="organization"
            :permissions="permissions"
            :type="link.config.resource"
            :entries="link.items"
            link
        ></inline-list>
      </div>
    </div>
    <md-dialog v-if="link !== undefined" ref="dialog">
      <md-dialog-title>
        <span>{{$t(type + '.link.' + link.resource)}}</span>
      </md-dialog-title>
      <md-dialog-content>
        <inline-list
            :organization="organization"
            :permissions="permissions"
            :personal="personal"
            :multiple="!link.exclusive"
            :all="!link.reverse && link.all"
            :type="link.resource"
            :search="link.reverse || !link.all"
            selectable
            @selected="addLink(link, $event)"
        ></inline-list>
      </md-dialog-content>
    </md-dialog>
  </div>
</template>

<script>
  import mixin from './mixin';
  import InlineList from './InlineList';
  import Config from '../../../models/Config';

  export default {
    mixins: [mixin],
    components: { InlineList },
    props: {
      item: Object,
      type: String,
      personal: Boolean,
      trash: Boolean,
      organization: Object,
      permissions: Object,
      list: Boolean,
      subMenu: Boolean,
      apart: Boolean
    },
    data() {
      return {
        resources: Config.resources,
        link: undefined
      };
    },
    watch: {
      link(link) {
        if (link) {
          this.$nextTick(() => {
            this.$nextTick(() => {
              this.$refs.dialog.open();
            });
          });
        } else {
          this.$refs.dialog.close();
        }
      }
    },
    computed: {
      links() {
        if (!this.type) {
          return [];
        }
        const links = [];
        Object.keys(this.resources).forEach((resource) => {
          const rc = this.resources[resource];
          if (rc.links && rc.links[this.type]) {
            let link = rc.links[this.type];
            if (typeof link !== 'object') {
              link = {};
            }
            links.push(Object.assign({ resource }, link));
          } else if (rc.links && resource === this.type) {
            Object.keys(rc.links).forEach((r) => {
              let rLink = rc.links[r];
              if (typeof rLink !== 'object') {
                rLink = {};
              }
              links.push(Object.assign({ resource: r, reverse: true }, rLink));
            });
          }
        });
        links.forEach((link) => {
          if (this.item.links && this.item.links[link.resource]) {
            link.items = Object.keys(this.item.links[link.resource]);
          } else {
            link.items = [];
          }
        });
        links.sort((linkA, linkB) => {
          if (linkA.priority && linkB.priority) {
            return linkB.priority - linkA.priority;
          } else if (linkA.priority) {
            return -1;
          } else if (linkB.priority) {
            return 1;
          }
          return 0;
        });
        return links;
      }
    },
    methods: {
      removeLink(link, item) {
        return new Promise((resolve) => {
          this.getFirebaseRef('resources', this.item.id)
            .child('links/' + item.resource + (link.exclusive ? '/' + item.id : ''))
            .remove().then(() => {
              this.getFirebaseRef(
                'resources', item.id, this.personal, item.resource
              )
                .child('links/' + this.type + '/' + this.item.id)
                .remove().then(() => {
                  resolve();
                });
            });
        });
      },
      addLink(link, item) {
        const promises = [];
        if (link.exclusive && this.item.links && this.item.links[item.resource]) {
          promises.push(this.removeLink(link, { resource: item.resource }));
        }
        Promise.all(promises).then(() => {
          const ourRef = this.getFirebaseRef('resources', this.item.id)
            .child('links/' + item.resource + '/' + item.id);
          const theirRef = this.getFirebaseRef(
            'resources', item.id, this.personal, item.resource
          ).child('links/' + this.type + '/' + this.item.id);
          ourRef.set(true);
          theirRef.set(true);
        });
        this.link = false;
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-links-list-item {
    width: 100%;
    > .md-menu  {
      width: 100%;
    }
  }
</style>