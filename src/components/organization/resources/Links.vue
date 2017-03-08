<!--
 This handles every display of links:
  - badges on the list items (badges)
  - menu entries in the items menus in list and detail view (menu)
  - list of all links (list)

 @TODO: Handle links to personal resources as well
 @TODO: Add journal entries for link actions
-->

<template>
  <div :class="['resource-links', {'resource-links-list-menu': menu}]">
    <template v-if="links.length && menu">
      <md-divider></md-divider>
      <md-menu-item v-for="link in links.assign" @selected="dialogLink = link" v-if="link.mayEdit">
        <md-icon class="link-icon">{{resources[link.resource].icon}}</md-icon>
        <span>{{$t('links.assign', {resource: $tc(link.resource + '.title', 1)})}}</span>
      </md-menu-item>
      <md-menu-item v-if="links.mayLink && links.normal.length" @selected="dialogLink = true">
        <md-icon>link</md-icon>
        <span>{{$t('links.link')}}</span>
      </md-menu-item>
    </template>
    <template v-if="badges">
      <md-menu md-size="5" ref="assignLinks" v-for="link in links.assign" v-if="link.items.length">
        <md-button class="md-icon-button" @click.native="loadLinks.push(link.resource)" md-menu-trigger>
          <md-icon>{{resources[link.resource].icon}}</md-icon>
          <span class="md-badge">{{link.items.length}}</span>
        </md-button>
        <md-menu-content>
          <inline-list
              :organization="organization"
              :permissions="permissions"
              :type="link.resource"
              :entries="link.items"
              :load="loadLinks.indexOf(link.resource) > -1"
              @click.native="$refs.assignLinks.forEach(function(assignLink) { assignLink.close(); })"
              :clearable="link.mayEdit"
              @clear="removeLink"
              link
          ></inline-list>
        </md-menu-content>
      </md-menu>
    </template>
    <template v-if="list && links.numItems">
      <slot></slot>
      <div class="resource-links-list">
        <inline-list
            class="resource-link" v-for="link in links" v-if="link.items.length"
            :organization="organization"
            :permissions="permissions"
            :type="link.resource"
            :entries="link.items"
            :clearable="link.mayEdit"
            @clear="removeLink"
            link
        ></inline-list>
      </div>
    </template>
    <md-dialog v-if="dialogLink !== undefined" ref="dialog" @close="dialogLink = false">
      <md-dialog-title v-if="dialogLink">
        <span>{{dialogLink === true ? $t('links.link') : $t('links.assign', {resource: $tc(dialogLink.resource + '.title', 1)})}}</span>
      </md-dialog-title>
      <md-dialog-content class="resource-links-dialog-content">
        <inline-list
            v-if="typeof dialogLink === 'object'"
            :organization="organization"
            :permissions="permissions"
            :personal="personal"
            :all="!dialogLink.reverse"
            :type="dialogLink.resource"
            :search="dialogLink.reverse"
            :entries="Array.prototype.concat.apply([{id: item.id, resource: type}], dialogLink.items.map(function(item) { return {id: item, resource: dialogLink.resource}; }))"
            selectable
            @selected="addLink($event)"
        ></inline-list>
        <inline-list
            v-else-if="dialogLink === true"
            :organization="organization"
            :permissions="permissions"
            :personal="personal"
            :type="links.normal.filter(function(link) { return link.mayEdit; }).map(function (link) { return link.resource; })"
            :entries="Array.prototype.concat.apply([{id: item.id, resource: type}], links.normal.map(function(link) { return link.items.map(function(item) { return {id: item, resource: link.resource}; }); }))"
            search
            selectable
            @selected="addLink($event)"
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
      archive: Boolean,
      organization: Object,
      permissions: Object,
      list: Boolean,
      menu: Boolean,
      badges: Boolean
    },
    data() {
      return {
        resources: Config.resources,
        dialogLink: undefined,
        loadLinks: []
      };
    },
    watch: {
      dialogLink(link) {
        if (link) {
          this.$nextTick(() => {
            this.$nextTick(() => {
              this.$refs.dialog.open();
            });
          });
        }
      }
    },
    computed: {
      links() {
        if (!this.type || !this.permissions) {
          return [];
        }
        const links = [];
        Object.keys(this.resources).forEach((resource) => {
          if (!this.permissions[resource].read) {
            return;
          }
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
        links.numItems = 0;
        links.mayLink = false;
        const mayEdit = this.permissions[this.type].write;
        links.forEach((link) => {
          link.mayEdit = mayEdit || this.permissions[link.resource].write;
          if (!link.assign && link.mayEdit) {
            links.mayLink = true;
          }
          if (this.item.links && this.item.links[link.resource]) {
            link.items = Object.keys(this.item.links[link.resource]);
            links.numItems += link.items.length;
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
        links.assign = links.filter(link => !!link.assign);
        links.normal = links.filter(link => !link.assign);
        return links;
      },
    },
    methods: {
      removeLink(item) {
        return new Promise((resolve) => {
          this.getFirebaseRef('resources', this.item.id)
            .child('links/' + item.resource + '/' + item.id)
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
      addLink(item) {
        const promises = [];
        Promise.all(promises).then(() => {
          const ourRef = this.getFirebaseRef('resources', this.item.id)
            .child('links/' + item.resource + '/' + item.id);
          const theirRef = this.getFirebaseRef(
            'resources', item.id, this.personal, item.resource
          ).child('links/' + this.type + '/' + this.item.id);
          ourRef.set(true);
          theirRef.set(true);
        });
        if (this.$refs.dialog) {
          this.$refs.dialog.close();
        }
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .link-icon {
    position: relative;
    &:after {
      content: "\E157";
      font-size: 16px;
      line-height: 10px;
      height: 10px;
      position: absolute;
      bottom: 0;
      right: -2px;
      background: rgba(#fff, 0.8);
      border-radius: 50%;
    }
  }
  .resource-links-list-menu {
    width: 100%;
    > .md-menu  {
      width: 100%;
    }
  }
  .resource-links-list {
    .md-list-item-container {
      padding-right: 0;
      padding-left: 8px;
      margin-left: -8px;
      &:hover {
        background-color: rgba(#000, 0.03) !important;
      }
    }
  }
  .has-mouse {
    .resource-links-list {
      .md-list-item-container {
        .md-button {
          opacity: 0;
          transition: opacity 0.2s;
        }
        &:hover .md-button {
          opacity: 1;
        }
      }
    }
  }
  .resource-links-dialog-content {
    .md-input-container {
      margin-top: 0;
    }
  }
</style>