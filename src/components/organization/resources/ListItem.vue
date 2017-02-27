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
      <template v-if="trash">
        <md-button v-if="trash" @click.stop="toggleTrash(item)" :title="$t('actions.restore')" class="md-icon-button">
          <md-icon>delete_sweep</md-icon>
        </md-button>
        <div style="flex: 1"></div>
      </template>
      <md-button @click="setLike(item, !like)" :class="['md-icon-button', {'md-accent': like}]">
        <md-icon>favorite</md-icon>
      </md-button>
      <share v-if="!trash && !personal" :url="getUrl(item.id)"></share>
      <item-menu :organization="organization" :item="item" :type="type" :personal="personal" :trash="trash" :permissions="permissions"></item-menu>
    </md-card-actions>
  </md-card>
</template>

<script>
  import auth from '../../../auth';
  import mixin from './mixin';
  import ResourceImage from './Image';
  import Share from '../../Share';
  import ItemMenu from './ItemMenu';

  export default {
    mixins: [mixin],
    components: { ResourceImage, Share, ItemMenu },
    props: {
      personal: Boolean,
      item: Object,
      type: String,
      trash: Boolean,
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