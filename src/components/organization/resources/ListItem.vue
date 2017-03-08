<template>
  <md-card class="resource-list-item" md-with-hover>
    <md-card-header>
      <md-card-header-text>
        <div class="md-title">{{item.title}}</div>
        <div class="md-subhead" v-if="item.subtitle">{{item.subtitle}}</div>
      </md-card-header-text>
    </md-card-header>
    <md-card-media v-if="item.image">
      <resource-image :image="item.image" @resource-image-shown="$emit('resource-image-shown')"></resource-image>
    </md-card-media>
    <router-link class="resource-list-item-link" :to="to"></router-link>
    <md-card-actions>
      <md-button v-if="archive" @click.native.stop="toggleArchive(item)" :title="$t('actions.restore')" class="md-icon-button">
        <md-icon>unarchive</md-icon>
      </md-button>
      <resource-links
          v-else
          badges
          :type="type" :item="item" :personal="personal" :organization="organization" :permissions="permissions"

      ></resource-links>
      <div style="flex: 1"></div>
      <md-button @click.native="setLike(item, !like)" :class="['md-icon-button', {'md-accent': like}]">
        <md-icon>favorite</md-icon>
      </md-button>
      <share v-if="!archive && !personal" :type="type" :id="item.id"></share>
      <md-menu v-if="!archive && permissions[type].write" md-size="4">
        <md-button class="md-icon-button" md-menu-trigger>
          <md-icon>more_vert</md-icon>
        </md-button>
        <md-menu-content>
          <md-menu-item @selected="$router.push({ path: to.path + '/edit', query: to.query })">
            <md-icon>edit</md-icon>
            <span>{{$t('actions.edit')}}</span>
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
    </md-card-actions>
  </md-card>
</template>

<script>
  import auth from '../../../auth';
  import mixin from './mixin';
  import ResourceImage from './Image';
  import Share from '../../Share';
  import ResourceLinks from './Links';

  export default {
    mixins: [mixin],
    components: { ResourceImage, Share, ResourceLinks },
    props: {
      personal: Boolean,
      item: Object,
      type: String,
      archive: Boolean,
      permissions: Object,
      organization: Object
    },
    data() {
      return {
        auth,
        like: false
      };
    },
    computed: {
      to() {
        const path = this.$route.path + '/' + this.item.id;
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
          this.like = false;
          if (item) {
            this.getLikesRef(item.id).on('value', (snapshot) => {
              this.like = !!snapshot.val();
            });
          }
        }
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-list-item {
    position: relative;
    .resource-list-item-link {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
    }

  }
</style>