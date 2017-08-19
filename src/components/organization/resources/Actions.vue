<!--
!item.creator means, item is new (not saved yet)
-->

<template>
  <div class="resource-actions">
    <md-menu md-size="5" ref="archiveInfo" v-if="item.archive">
      <md-button
          class="md-icon-button md-warn resource-actions-archive-info-btn"
          @click.native="loadArchiveInfo()"
          md-menu-trigger
      >
        <md-icon>archive</md-icon>
      </md-button>
      <md-menu-content class="resource-actions-archive-info">
        <md-spinner v-if="archiveInfo === undefined" :md-size="20" md-indeterminate class="md-accent"></md-spinner>
        <avatar :organization="organization" :uid="archiveInfo.uid" v-if="archiveInfo">
          <template scope="avatar">
            <div class="resource-actions-archive-info-label">
              {{avatar.user.displayName}} {{$t('journal.archive', {resource: $t('journal.this')})}}
              <div class="resource-actions-archive-info-time">
                {{moment(archiveInfo.time).calendar()}}
              </div>
            </div>
            <div class="resource-actions-archive-info-occasion">
              <md-icon class="md-small" :class="archiveInfo.completed ? 'md-primary' : 'md-warn'">
                {{archiveInfo.icon}}
              </md-icon>
              <span>{{$t('transition.' + archiveInfo.occasion)}}</span>
            </div>
            <editor-text v-if="archiveInfo.comment" :organization="organization" :text="archiveInfo.comment"></editor-text>
            <div class="resource-actions-archive-info-actions" v-if="permissions[item.resource].write">
              <md-button @click.native="$refs.archiveInfo.close(); toggleArchive()">{{$t('actions.restore')}}</md-button>
            </div>
          </template>
        </avatar>
      </md-menu-content>
    </md-menu>

    <md-button
        @click.native="!item.creator ? $emit('togglePersonal') : togglePersonal()"
        :class="['md-icon-button', {'md-warn': item.personal}]"
        v-if="item.personal || !item.creator">
      <md-icon>
        lock_outline
        <md-tooltip>
          {{$t(item.resource + '.this')}} {{$t('is' + (item.personal ? 'Personal' : 'Public'))}} -
          {{$t('actions.make' + (!item.personal ? 'Personal' : 'Public')).toLowerCase()}}
        </md-tooltip>
      </md-icon>
    </md-button>

    <md-button
        @click.native="toggleWatching"
        :class="['md-icon-button']"
        v-if="watcher && watcher.isWatching">
      <md-icon>
        notifications
        <md-tooltip>{{$t('actions.stopWatching')}}</md-tooltip>
      </md-icon>
    </md-button>

    <resource-links
        v-if="!item.archive && showLinkBadges"
        badges :item="item" :organization="organization" :permissions="permissions"
    ></resource-links>

    <div style="flex: 1" v-if="distribute"></div>

    <md-button v-if="showLike" @click.native="setLike(item, !hasLiked)" :class="['md-icon-button', {'md-accent': hasLiked}]">
      <md-icon>favorite</md-icon>
    </md-button>

    <share v-if="!item.archive && !item.personal && item.creator" :type="item.resource" :id="item.id"></share>

    <md-button v-if="!showEditInMenu && item.creator" class="md-icon-button" @click.native="$router.push({ path: to.path + '/edit', query: to.query })">
      <md-icon>mode_edit</md-icon>
      <md-tooltip>{{$t('actions.editAll')}}</md-tooltip>
    </md-button>

    <md-menu v-if="item.creator" md-size="4">
      <md-button class="md-icon-button" md-menu-trigger>
        <md-icon>more_vert</md-icon>
      </md-button>
      <md-menu-content>
        <md-menu-item v-if="showEditInMenu" @selected="$router.push({ path: to.path + '/edit', query: to.query })">
          <md-icon>edit</md-icon>
          <span>{{$t('actions.edit')}}</span>
        </md-menu-item>
        <md-menu-item v-if="watcher && watcher.isWatching === false" @selected="toggleWatching">
          <md-icon>notifications</md-icon>
          <span>{{$t('actions.watch')}}</span>
        </md-menu-item>
        <md-menu-item @selected="togglePersonal()" v-if="showPersonal && !item.personal && item.creator === auth.user.uid">
          <md-icon>lock_outline</md-icon>
          <span>{{$t('actions.makePersonal')}}</span>
        </md-menu-item>
        <md-menu-item @selected="toggleArchive()" v-if="!item.archive && permissions[item.resource].write">
          <md-icon>archive</md-icon>
          <span>{{$t('actions.archive')}}</span>
        </md-menu-item>
        <md-menu-item
            @selected="confirm = {action: 'delete', handler: deleteItem}"
            v-if="showDelete && permissions.role === 'admin'">
          <md-icon>delete</md-icon>
          <span>{{$t('actions.delete')}}</span>
        </md-menu-item>
        <resource-links
            :item="item" :organization="organization" :permissions="permissions" v-if="!item.archive"
            menu
        ></resource-links>
      </md-menu-content>
    </md-menu>

    <md-dialog-confirm
        v-if="confirm !== undefined"
        ref="confirmDialog"
        :md-title="$t('confirm.' + confirm.action + '.title')"
        :md-content="$t('confirm.' + confirm.action + '.content')"
        :md-ok-text="$t('actions.' + confirm.action)"
        :md-cancel-text="$t('actions.cancel')"
        @close="$event === 'ok' ? confirm.handler() : null"
    ></md-dialog-confirm>

    <md-dialog
        v-if="transition !== undefined"
        ref="transitionDialog"
        :md-click-outside-to-close="false"
        :md-esc-to-close="false"
        @close="transition = false"
    >
      <md-dialog-title>{{$t('actions.' + (item.archive ? 'restore' : 'archive'))}}</md-dialog-title>
      <md-dialog-content>
        <div v-if="!item.archive">
          <div class="md-caption">{{$t('transition.occasion')}}</div>
          <md-radio
              @change="$refs.transitionReason.focus();"
              v-model="transition.occasion"
              name="transition-occasion"
              :md-value="occasion"
              v-for="occasion in occasions"
          >{{$t('transition.' + occasion)}}</md-radio>
        </div>
        <md-input-container>
          <label>{{$t('transition.reason')}}</label>
          <editor ref="transitionReason" :organization="organization" v-model="transition.reason" toolbar="small"></editor>
        </md-input-container>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button @click.native="$refs.transitionDialog.close()">{{$t('actions.cancel')}}</md-button>
        <div style="flex: 1; min-width: 24px;"></div>
        <md-button class="md-primary md-raised" :disabled="!item.archive && !transition.occasion" @click.native="toggleArchive()">{{$t('actions.' + (item.archive ? 'restore' : 'archive'))}}</md-button>
      </md-dialog-actions>
    </md-dialog>
  </div>
</template>

<script>
  import auth from '../../../auth';
  import mixin from './mixin';
  import Share from '../../Share';
  import ResourceLinks from './Links';
  import Avatar from '../../Avatar';
  import Editor from '../common/Editor';
  import EditorText from '../common/EditorText';
  import Config from '../../../models/Config';
  import Item from '../../../models/Item';

  export default {
    mixins: [mixin],
    components: { Share, ResourceLinks, Avatar, Editor, EditorText },
    props: {
      organization: Object,
      item: Object,
      permissions: Object,
      // Buttons:
      showLinkBadges: Boolean,
      showEditInMenu: Boolean,
      showLike: Boolean,
      distribute: Boolean,
      showPersonal: Boolean,
      showDelete: Boolean,
      showNotifications: Boolean,
      redirectOnToggle: Boolean
    },
    data() {
      return {
        auth,
        hasLiked: false,
        confirm: undefined,
        transition: undefined,
        archiveInfo: false,
        watcher: undefined
      };
    },
    computed: {
      to() {
        const path = this.getUrlPath(Object.assign({ id: this.item.id }, this.$route.params));
        const query = Object.assign({}, this.$route.query);
        if (this.$route.params.search) {
          query.type = this.item.resource;
          if (this.item.personal) {
            query.personal = 1;
          }
        }
        return { path, query };
      },
      occasions() {
        return this.item ? Config.resources[this.item.resource].transitions.occasions : [];
      }
    },
    watch: {
      item: {
        immediate: true,
        handler(item) {
          this.hasLiked = false;
          this.watcher = undefined;
          this.archiveInfo = undefined;
          if (this.refs) {
            this.refs.forEach(ref => ref.off('value'));
          }
          this.refs = [];
          if (item && this.showLike) {
            const likesRef = this.getLikesRef(item.id);
            this.refs.push(likesRef);
            likesRef.on('value', (snapshot) => {
              this.hasLiked = !!snapshot.val();
            });
          }
          if (item && item.creator && this.showNotifications) {
            this.watcher = this.organization.watchers.get(item, auth.user.uid);
          }
        }
      },
      confirm(confirm) {
        this.handleDialog('confirm', confirm);
      },
      transition(transition) {
        this.handleDialog('transition', transition);
      }
    },
    beforeDestroy() {
      if (this.refs) {
        this.refs.forEach(ref => ref.off('value'));
        delete this.refs;
      }
      if (this.watcher) {
        this.watcher.off();
      }
    },
    methods: {
      handleDialog(type, open) {
        if (open) {
          this.$nextTick(() => {
            this.$nextTick(() => {
              this.$refs[type + 'Dialog'].open();
            });
          });
        }
      },
      loadArchiveInfo() {
        if (this.archiveInfo && this.archiveInfo.id === this.item.id) {
          return;
        }
        this.archiveInfo = undefined;
        this.organization.journal.getArchiveInfo(this.item).then((archiveInfo) => {
          this.archiveInfo = archiveInfo;
        });
      },
      toggleWatching() {
        this.watcher.toggle();
      },
      togglePersonal() {
        /** @type {Item} */
        const it = this.item;
        const personal = it.personal;
        const archive = it.archive;
        Item.getFirebaseRef(it.resource, archive, !personal, it.id)
          .set(it.prepareForFirebase())
          .then(() => {
            this.organization.journal.getRef()
              .orderByChild('id')
              .equalTo(it.id)
              .once('value', (sn) => {
                sn.forEach((csn) => {
                  csn.ref.update({ personal: !personal });
                });
              });

            this.updateLinks(archive, !personal);

            it.ref().remove();
            if (this.redirectOnToggle) {
              this.$router.replace(this.getUrlPath(it.id, !personal, archive, it.resource));
            }
          });
      },
      updateLinks(archive, personal) {
        /** @type {Item} */
        const item = this.item;

        let linkValue = true;
        if (archive || personal) {
          linkValue = {};
          if (personal) {
            linkValue.personal = auth.user.uid;
          }
          if (archive) {
            linkValue.archive = true;
          }
        }
        this.forEachLink((link) => {
          Item.getFirebaseRef(link.resource, link.archive, link.personal, link.id)
            .child('links/' + item.resource + '/' + item.id)
            .set(linkValue);
        });
      },
      forEachLink(callback) {
        if (!this.item.links) {
          return;
        }
        Object.keys(Config.resources).forEach((resource) => {
          if (!this.item.links[resource]) {
            return;
          }
          Object.keys(this.item.links[resource]).forEach((id) => {
            let item = this.item.links[resource][id];
            if (item === true) {
              item = {};
            }
            callback(Object.assign({ id, resource }, item));
          });
        });
      },
      toggleArchive() {
        /** @type {Item} */
        const item = this.item;
        const archive = item.archive;
        if (!this.transition) {
          this.transition = { occasion: undefined, reason: undefined };
          return;
        }
        const transition = Object.assign({}, this.transition);
        this.$refs.transitionDialog.close();

        Item.getFirebaseRef(item.resource, !archive, item.personal, item.id)
          .set(item.prepareForFirebase())
          .then(() => {
            const props = {};
            if (transition.occasion) {
              props[transition.occasion] = true;
            }
            this.organization.journal.addEntry(
              item, archive ? 'unarchive' : 'archive',
              undefined, transition.reason, props
            );
            this.updateLinks(!archive, item.personal);
            item.ref().remove().then(() => {
              if (this.redirectOnToggle) {
                this.$router.replace(
                  this.getUrlPath(item.id, item.personal, !archive, item.resource)
                );
              }
            });
          });
      },
      deleteItem() {
        /** @type {Item} */
        const item = this.item;
        const promises = [
          this.organization.journal.clear(item),
          this.organization.watchers.clear(item)
        ];
        this.forEachLink((link) => {
          promises.push(
            Item.getFirebaseRef(link.resource, link.archive, link.personal, link.id)
              .child('links/' + item.resource + '/' + item.id)
              .remove()
          );
        });
        Promise.all(promises).then(() => {
          item.ref().remove().then(() => {
            this.$emit('deleted');
          });
        });
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-actions-archive-info-btn {
    &:after {
      content: "";
      display: block;
      position: absolute;
      left: 15px;
      bottom: 5px;
      width: 10px;
      height: 1px;
      border-bottom: 2px dotted rgba(#000, 0.56);
    }
  }
  .resource-actions-archive-info {
    .md-list {
      padding-top: 16px;
      padding-left: 16px;
      padding-right: 16px;
    }
    .resource-actions-archive-info-time {
      color: rgba(#000, 0.56);
      font-size: 12px;
    }
    .resource-actions-archive-info-occasion {
      margin-top: 10px;
      span {
        font-weight: 500;
      }
    }
    .md-editor-text {
      margin-top: 4px;
    }
    .md-button {
      margin-left: -16px;
    }
  }
</style>