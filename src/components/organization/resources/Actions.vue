<!--
!item.creator means, item is new (not saved yet)
-->

<template>
  <div class="resource-actions">
    <md-menu>
      <md-button
          v-if="archive && permissions[type].write"
          class="md-icon-button md-warn resource-actions-archive-info"
          @mouseover.native="loadArchiveInfo()"
          md-menu-trigger
      >
        <md-icon>archive</md-icon>
      </md-button>
      <md-menu-content>
        <md-spinner v-if="archiveInfo === undefined" :md-size="20" md-indeterminate class="md-accent"></md-spinner>
        <div v-if="archiveInfo">
          <div v-html="archiveInfo.comment"></div>
        </div>
      </md-menu-content>
    </md-menu>

    <md-button
        @click.native="!item.creator ? $emit('togglePersonal') : togglePersonal()"
        :class="['md-icon-button', {'md-warn': personal}]"
        v-if="personal || !item.creator">
      <md-icon>
        lock_outline
        <md-tooltip>
          {{$t(type + '.this')}} {{$t('is' + (personal ? 'Personal' : 'Public'))}} -
          {{$t('actions.make' + (!personal ? 'Personal' : 'Public')).toLowerCase()}}
        </md-tooltip>
      </md-icon>
    </md-button>

    <resource-links
        v-if="!archive && showLinkBadges"
        badges
        :type="type" :item="item" :personal="personal" :organization="organization" :permissions="permissions"
    ></resource-links>

    <div style="flex: 1" v-if="distribute"></div>

    <md-button v-if="showLike" @click.native="setLike(item, !hasLiked)" :class="['md-icon-button', {'md-accent': hasLiked}]">
      <md-icon>favorite</md-icon>
    </md-button>

    <share v-if="!archive && !personal && item.creator" :type="type" :id="item.id"></share>

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
        <md-menu-item @selected="togglePersonal()" v-if="showPersonal && !personal && item.creator === auth.user.uid">
          <md-icon>lock_outline</md-icon>
          <span>{{$t('actions.makePersonal')}}</span>
        </md-menu-item>
        <md-menu-item @selected="toggleArchive()" v-if="!archive && permissions[type].write">
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
            :type="type" :item="item" :personal="personal" :organization="organization" :permissions="permissions" v-if="!archive"
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
      <md-dialog-title>{{$t('actions.' + (archive ? 'restore' : 'archive'))}}</md-dialog-title>
      <md-dialog-content>
        <div v-if="!archive">
          <div class="md-caption">{{$t('transition.occasion')}}</div>
          <md-radio
              @change="$refs.transitionReason.focus();"
              v-model="transition.occasion"
              name="transition-occasion"
              :md-value="occasion"
              v-for="occasion in ['discarded', 'completed']"
          >{{$t('transition.' + occasion)}}</md-radio>
        </div>
        <md-input-container>
          <label>{{$t('transition.reason')}}</label>
          <md-editor ref="transitionReason" v-model="transition.reason" toolbar="small"></md-editor>
        </md-input-container>
      </md-dialog-content>
      <md-dialog-actions>
        <md-button @click.native="$refs.transitionDialog.close()">{{$t('actions.cancel')}}</md-button>
        <div style="flex: 1; min-width: 24px;"></div>
        <md-button class="md-primary md-raised" :disabled="!archive && !transition.occasion" @click.native="toggleArchive()">{{$t('actions.' + (archive ? 'restore' : 'archive'))}}</md-button>
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

  export default {
    mixins: [mixin],
    components: { Share, ResourceLinks, Avatar },
    props: {
      organization: Object,
      type: String,
      personal: Boolean,
      item: Object,
      archive: Boolean,
      permissions: Object,
      // Buttons:
      showLinkBadges: Boolean,
      showEditInMenu: Boolean,
      showLike: Boolean,
      distribute: Boolean,
      showPersonal: Boolean,
      showDelete: Boolean,
      redirectOnToggle: Boolean
    },
    data() {
      return {
        auth,
        hasLiked: false,
        confirm: undefined,
        transition: undefined,
        archiveInfo: false,
      };
    },
    computed: {
      to() {
        const path = this.getUrlPath(Object.assign({ id: this.item.id }, this.$route.params));
        const query = Object.assign({}, this.$route.query);
        if (this.$route.params.search) {
          query.type = this.type;
          if (this.personal) {
            query.personal = 1;
          }
        }
        return { path, query };
      }
    },
    watch: {
      item: {
        immediate: true,
        handler(item) {
          this.hasLiked = false;
          if (item && this.showLike) {
            this.getLikesRef(item.id).on('value', (snapshot) => {
              this.hasLiked = !!snapshot.val();
            });
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
        const ref = this.organization.journal.getRef().orderByChild('id').equalTo(this.item.id);
        ref.on('child_added', (sn) => {
          if (sn.val().action === 'archive') {
            this.archiveInfo = sn.val();
            this.ref.off('child_added');
          }
        });
      },
      togglePersonal() {
        const it = this.item;
        const personal = this.personal;
        const archive = this.archive;
        this.getFirebaseRef(archive, it.id, !personal)
          .set(this.prepareItemForFirebase(it))
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

            this.getFirebaseRef(archive, it.id, personal).remove();
            if (this.redirectOnToggle) {
              this.$router.replace(this.getUrlPath(it.id, !personal, archive));
            }
          });
      },
      updateLinks(archive, personal) {
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
          this.getFirebaseRef(link.archive, link.id, link.personal, link.resource)
            .child('links/' + this.type + '/' + item.id)
            .set(linkValue);
        });
      },
      forEachLink(callback) {
        Object.keys(this.item.links).forEach((resource) => {
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
        const item = this.item;
        const archive = this.archive;
        if (!this.transition) {
          this.transition = { occasion: undefined, reason: undefined };
          return;
        }
        const transition = Object.assign({}, this.transition);
        this.$refs.transitionDialog.close();

        this.getFirebaseRef(!archive ? 'archive' : 'resources', item.id)
          .set(this.prepareItemForFirebase(item))
          .then(() => {
            const props = {};
            if (transition.occasion) {
              props[transition.occasion] = true;
            }
            this.organization.journal.addEntry(
              this.type, this.personal, item.id, archive ? 'unarchive' : 'archive',
              undefined, transition.reason, props
            );
            this.updateLinks(!archive, this.personal);
            this.getFirebaseRef(archive, item.id).remove().then(() => {
              if (this.redirectOnToggle) {
                this.$router.replace(this.getUrlPath(item.id, this.personal, !archive));
              }
            });
          });
      },
      deleteItem() {
        const item = this.item;
        const promises = [];
        promises.push(new Promise((resolve) => {
          this.organization.journal.getRef()
            .orderByChild('id')
            .equalTo(item.id)
            .once('value', (sn) => {
              sn.forEach((csn) => {
                promises.push(csn.ref.remove());
              });
              resolve();
            });
        }));
        this.forEachLink((link) => {
          promises.push(
            this.getFirebaseRef(link.archive, link.id, link.personal, link.resource)
              .child('links/' + this.type + '/' + item.id)
              .remove()
          );
        });
        Promise.all(promises).then(() => {
          this.getFirebaseRef(this.archive, item.id).remove().then(() => {
            this.$emit('deleted');
          });
        });
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-actions-archive-info {
  }
</style>