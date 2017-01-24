<template>
  <md-card md-with-hover>
    <md-card-header>
      <md-card-header-text>
        <div class="md-title">{{item.title}}</div>
        <div class="md-subhead">{{item.description}}</div>
      </md-card-header-text>
      <md-menu v-if="!trash" md-size="4" md-direction="bottom left">
        <md-button class="md-icon-button" md-menu-trigger>
          <md-icon>more_vert</md-icon>
        </md-button>
        <md-menu-content>
          <md-menu-item v-if="permissions[type].write && item.creator === auth.user.uid">
            <router-link :to="'/' + organization.key + '/' + type + '/' + item.id + '/edit'" exact>
              <md-icon>create</md-icon>
              <span>{{$t('actions.edit')}}</span>
            </router-link>
          </md-menu-item>
          <md-menu-item @selected="toggleTrash" v-if="permissions[type].write && item.creator === auth.user.uid">
            <md-icon>delete</md-icon>
            <span>{{$t('actions.delete')}}</span>
          </md-menu-item>
        </md-menu-content>
      </md-menu>
      <md-button v-else @click="toggleTrash" :title="$t('actions.restore')" class="md-icon-button">
        <md-icon>delete_sweep</md-icon>
      </md-button>
    </md-card-header>
    <md-card-media v-if="item.image">
      <resource-image :image="item.image"></resource-image>
    </md-card-media>
    <md-card-content>
      Huhu
    </md-card-content>
  </md-card>
</template>

<script>
  import auth from '../../../auth';
  import mixin from './mixin';
  import ResourceImage from './Image';

  export default {
    mixins: [mixin],
    components: { ResourceImage },
    props: {
      item: Object,
      type: String,
      trash: Boolean,
      permissions: Object,
      organization: Object
    },
    data() {
      return {
        auth
      };
    },
    methods: {
      toggleTrash() {
        this.getFirebaseRef(!this.trash, this.item.id)
          .set(this.prepareItemForFirebase(this.item))
          .then(() => {
            this.getFirebaseRef(this.trash, this.item.id).remove();
          });
      }
    }
  };
</script>