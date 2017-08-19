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
    <resource-actions
        class="md-card-actions"
        :organization="organization"
        :permissions="permissions"
        :item="item"
        show-like
        show-link-badges
        show-edit-in-menu
        distribute
    >
    </resource-actions>
  </md-card>
</template>

<script>
  import auth from '../../../auth';
  import mixin from './mixin';
  import ResourceImage from './Image';
  import ResourceActions from './Actions';

  export default {
    mixins: [mixin],
    components: { ResourceImage, ResourceActions },
    props: {
      item: Object,
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
        const isSearch = !!this.$route.params.search;
        const params = Object.assign({}, this.$route.params, { id: this.item.id });
        if (isSearch) {
          ['type', 'personal', 'archive'].forEach((key) => {
            if (params[key] === undefined) {
              params[key] = null;
            }
          });
        }
        const path = this.getUrlPath(params);
        const query = Object.assign({}, this.$route.query);
        if (isSearch) {
          query.type = this.item.resource;
          if (this.item.personal) {
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