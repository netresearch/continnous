<template>
  <md-menu v-if="!trash && permissions[type].write" md-size="4">
    <md-button class="md-icon-button" md-menu-trigger>
      <md-icon>more_vert</md-icon>
    </md-button>
    <md-menu-content>
      <md-menu-item @selected="toggleTrash(redirect ? undefined : item)" v-if="!trash && permissions[type].write">
        <md-icon>delete</md-icon>
        <span>{{$t('actions.delete')}}</span>
      </md-menu-item>
      <md-menu-item v-for="linkConfig in getLinks(true)" @selected="link = linkConfig" v-if="!item.links || !item.links[linkConfig.resource]">
        <md-icon>{{resources[linkConfig.resource].icon}}</md-icon>
        <span>{{linkConfig.add ? 'Add to' : 'Link to'}} {{$tc(linkConfig.resource + '.title', 1)}}</span>
      </md-menu-item>
      <slot></slot>
    </md-menu-content>
    <md-dialog v-if="link" ref="dialog">
      <md-dialog-title>
        <span>{{link.add ? 'Add to' : 'Link to'}} {{$tc(link.resource + '.title', 1)}}</span>
      </md-dialog-title>
      <md-dialog-content>
        <inline-list
            :organization="organization"
            :personal="personal"
            :multiple="!link.exclusive"
            :all="link.all || false"
            :type="link.resource"
            selectable
            @selected="addLink(link, $event)"
        ></inline-list>
      </md-dialog-content>
    </md-dialog>
  </md-menu>
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
      redirect: Boolean
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
    methods: {
      getLinks(apart) {
        if (!this.type) {
          return [];
        }
        const links = [];
        Object.keys(this.resources).forEach((resource) => {
          const rc = this.resources[resource];
          if (rc.links && rc.links[this.type]) {
            const link = rc.links[this.type];
            if (apart === undefined || (apart && link.apart) || (!apart && !link.apart)) {
              links.push(Object.assign({ resource }, link));
            }
          }
        });
        return links;
      },
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
        this.link = undefined;
      }
    }
  };
</script>