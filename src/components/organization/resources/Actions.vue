<!--
!item.creator means, item is new (not saved yet)
-->

<template>
  <div class="resource-actions">
    <md-button v-if="archive && permissions[type].write" @click.native.stop="toggleArchive(item)" :title="$t('actions.restore')" class="md-icon-button">
      <md-icon>unarchive</md-icon>
    </md-button>

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
        <md-menu-item @selected="toggleArchive(item)" v-if="!archive && permissions[type].write">
          <md-icon>archive</md-icon>
          <span>{{$t('actions.archive')}}</span>
        </md-menu-item>
        <resource-links
            :type="type" :item="item" :personal="personal" :organization="organization" :permissions="permissions" v-if="!archive"
            menu
        ></resource-links>
      </md-menu-content>
    </md-menu>
  </div>
</template>

<script>
  import auth from '../../../auth';
  import mixin from './mixin';
  import Share from '../../Share';
  import ResourceLinks from './Links';

  export default {
    mixins: [mixin],
    components: { Share, ResourceLinks },
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
      redirectOnToggle: Boolean
    },
    data() {
      return {
        auth,
        hasLiked: false
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
      }
    },
    methods: {

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
        Object.keys(item.links).forEach((resource) => {
          Object.keys(item.links[resource]).forEach((target) => {
            let value = item.links[resource][target];
            if (value === true) {
              value = {};
            }
            this.getFirebaseRef(!!value.archive, target, !!value.personal, resource)
              .child('links/' + this.type + '/' + item.id)
              .set(linkValue);
          });
        });
      },
      toggleArchive() {
        const item = this.item;
        const archive = this.archive;
        this.getFirebaseRef(!archive ? 'archive' : 'resources', item.id)
          .set(this.prepareItemForFirebase(item))
          .then(() => {
            this.organization.journal.addEntry(
                this.type, this.personal, item.id, archive ? 'unarchive' : 'archive'
            );
            this.updateLinks(!archive, this.personal);
            this.getFirebaseRef(archive ? 'archive' : 'resources', item.id).remove().then(() => {
              if (this.redirectOnToggle) {
                this.$router.replace(this.getUrlPath(item.id, this.personal, !archive));
              }
            });
          });
      },
    }
  };
</script>