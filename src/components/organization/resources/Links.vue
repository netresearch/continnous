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
        <md-button class="md-icon-button" @click.native="loadLinks.push(link.resource)" md-menu-trigger :data-md-badge="link.items.length">
          <md-icon>{{resources[link.resource].icon}}</md-icon>
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
    <template v-if="list && (links.numItems || connectionLinks)">
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
        <div class="resource-link"  v-if="connectionLinks && connections">
          <component
              v-for="(cLinks, connectionKey) in connectionLinks"
              :is="connections[connectionKey].linkList"
              :connection="connections[connectionKey]"
              :links="cLinks"
              :item="item"
              :type="item.resource"
              :clearable="permissions[item.resource].write"
              @clear="removeConnectionLink(connectionKey, $event)"
          >
          </component>
        </div>
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
            :personal="item.personal"
            :all="!dialogLink.reverse"
            :type="dialogLink.resource"
            :search="dialogLink.reverse"
            :entries="Array.prototype.concat.apply([item], dialogLink.items)"
            selectable
            @selected="addLink($event)"
        ></inline-list>
        <template v-else-if="dialogLink === true">
          <div v-if="connections && Object.keys(connections).length > 0">
            <md-radio v-model="linkConnection" :md-value="false">Intern</md-radio>
            <md-radio
                v-model="linkConnection"
                v-for="(connection, key) in connections"
                :md-value="key"
            >{{connection.options.title}}</md-radio>
          </div>
          <inline-list
              v-if="!linkConnection"
              :organization="organization"
              :permissions="permissions"
              :personal="item.personal"
              :type="links.normal.filter(function(link) { return link.mayEdit; }).map(function (link) { return link.resource; })"
              :entries="Array.prototype.concat.apply([{item}], links.normal.map(function(link) { return link.items; }))"
              search
              selectable
              @selected="addLink($event)"
          ></inline-list>
          <component
              v-else
              :is="connections[linkConnection].linkForm"
              :organization="organization"
              :item="item"
              :connection="connections[linkConnection]"
              :current="connectionLinks ? connectionLinks[linkConnection] : undefined"
              @add="addConnectionLink(linkConnection, $event)"
          ></component>
        </template>
      </md-dialog-content>
    </md-dialog>
  </div>
</template>

<script>
  import mixin from './mixin';
  import InlineList from './InlineList';
  import Config from '../../../models/Config';
  import auth from '../../../auth';
  import Connections from '../../../models/Connections';
  import Item from '../../../models/Item';

  export default {
    mixins: [mixin],
    components: { InlineList },
    props: {
      item: Object,
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
        loadLinks: [],
        connections: undefined,
        linkConnection: false
      };
    },
    watch: {
      dialogLink(link) {
        this.linkConnection = false;
        if (link) {
          this.loadConnections();
          this.$nextTick(() => {
            this.$nextTick(() => {
              this.$refs.dialog.open();
            });
          });
        }
      }
    },
    computed: {
      connectionLinks() {
        let links;
        if (this.item && this.item.links && this.organization && this.organization.connections) {
          Object.keys(this.organization.connections).forEach((key) => {
            if (this.item.links[key]) {
              if (!links) {
                links = {};
              }
              links[key] = this.item.links[key];
            }
          });
          if (links) {
            this.loadConnections();
          }
        }
        return links;
      },
      links() {
        if (!this.item || !this.permissions) {
          return [];
        }
        const links = [];
        Object.keys(this.resources).forEach((resource) => {
          if (!this.permissions[resource].read) {
            return;
          }
          const rc = this.resources[resource];
          if (rc.links && rc.links[this.item.resource]) {
            let link = rc.links[this.item.resource];
            if (typeof link !== 'object') {
              link = {};
            }
            links.push(Object.assign({ resource }, link));
          } else if (rc.links && resource === this.item.resource) {
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
        const mayEdit = this.permissions[this.item.resource].write;
        links.forEach((link) => {
          link.mayEdit = mayEdit || this.permissions[link.resource].write;
          if (!link.assign && link.mayEdit) {
            links.mayLink = true;
          }
          if (this.item.links && this.item.links[link.resource]) {
            link.items = Object.keys(this.item.links[link.resource]).map((id) => {
              const linkItem = new Item(link.resource, id);
              const value = this.item.links[link.resource];
              if (typeof value === 'object') {
                Object.assign(linkItem, value);
              }
              return linkItem;
            });
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
      loadConnections() {
        if (!this.connections) {
          Connections.getForOrganization(this.organization).then((connections) => {
            this.connections = connections.filter(connection => connection.linkForm);
          });
        }
      },
      removeLink(item) {
        return new Promise((resolve) => {
          this.item.ref()
            .child('links/' + item.resource + '/' + item.id)
            .remove().then(() => {
              item.ref()
                .child('links/' + this.item.resource + '/' + this.item.id)
                .remove().then(() => {
                  resolve();
                });
            });
        });
      },
      addLink(item) {
        const promises = [];
        Promise.all(promises).then(() => {
          const setLink = (ref, archive, personal) => {
            if (!archive && !personal) {
              ref.set(true);
            } else {
              const data = {};
              if (personal) {
                data.personal = auth.user.uid;
              }
              if (archive) {
                data.archive = true;
              }
              ref.set(data);
            }
          };
          // ours:
          setLink(
            this.item.ref().child('links/' + item.resource + '/' + item.id),
            item.archive,
            item.personal
          );
          // theirs:
          setLink(
            item.ref().child('links/' + this.item.resource + '/' + this.item.id),
            this.item.archive,
            this.item.personal
          );
        });
        if (this.$refs.dialog) {
          this.$refs.dialog.close();
        }
      },
      addConnectionLink(connectionKey, link) {
        this.item.ref().child('links/' + connectionKey).push(link);
        if (this.$refs.dialog) {
          this.$refs.dialog.close();
        }
      },
      removeConnectionLink(connectionKey, linkKey) {
        this.item.ref().child('links/' + connectionKey + '/' + linkKey).remove();
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