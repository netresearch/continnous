<template>

  <div class="scroll-container">
    <md-toolbar class="md-dense">
      <h2 class="md-title">{{title}}</h2>
    </md-toolbar>
    <md-toolbar class="md-dense md-nav-bar">
      <slot name="buttons"></slot>
      <div style="flex: 1"></div>
      <md-menu md-direction="bottom left" md-size="4">
        <md-button md-menu-trigger>
          <template v-for="field in sortFields" v-if="field.current">
            <md-icon>arrow_{{reverseOrderQuery.order !== 'desc' ? 'down' : 'up'}}ward</md-icon>
            {{$t('fields.' + field.name)}}
          </template>
        </md-button>
        <md-menu-content>
          <md-subheader>{{$t('sort.sort')}}</md-subheader>
          <md-menu-item
              v-for="field in sortFields"
              @selected="$router.replace({query: field.query})"
              :disabled="field.current"
          >{{$t('fields.' + field.name)}}</md-menu-item>
          <md-divider></md-divider>
          <md-subheader>{{$t('sort.order')}}</md-subheader>
          <md-menu-item
              v-for="order in ['asc', 'desc']"
              @selected="$router.replace({query: reverseOrderQuery})"
              :disabled="reverseOrderQuery.order !== order"
          >
            <span>{{$t('sort.' + order)}}</span>
            <md-icon>arrow_{{order === 'desc' ? 'down' : 'up'}}ward</md-icon>
          </md-menu-item>
        </md-menu-content>
      </md-menu>
      <md-button class="md-icon-button" @click="masonry = !masonry">
        <md-icon>{{'view_' + (masonry ? 'stream' : 'quilt')}}</md-icon>
      </md-button>
      <md-button v-if="trashEnabled" @click="$router.push('/' + organization.key + '/' + type + (personal ? '/personal' : '') + (trash ? '' : '/trash'))" :class="{'md-contrast': trash}">
        <md-icon>delete</md-icon>
        <span>{{$t('trash')}}</span>
      </md-button>
    </md-toolbar>

    <slot></slot>

    <div class="scroll-content">
      <div ref="list" :class="['resources-list', 'resources-list-' + (masonry ? 'masonry' : 'stream')]">
        <div class="resources-list-width"></div>
        <div :class="['resources-list-item', 'item-' + item.id]" v-for="item in items">
          <resource-item
              :item="item"
              :trash="trash"
              :personal="item.hasOwnProperty('personal') ? item.personal : personal"
              :permissions="permissions"
              :type="item.resource || type"
              :organization="organization"
          ></resource-item>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Masonry from 'masonry-layout';
  import ResourceItem from './Item';

  export default {
    components: { ResourceItem },
    props: {
      items: [Array, Object],
      title: String,
      organization: Object,
      type: String,
      permissions: Object,
      trash: Boolean,
      trashEnabled: Boolean,
      personal: Boolean,
      sort: String,
      order: String,
      additionalSort: [String, Array]
    },
    data() {
      return {
        mounted: false,
        masonry: true
      };
    },
    computed: {
      reverseOrderQuery() {
        const query = Object.assign({}, this.$route.query);
        const current = this.order || this.$route.query.order || 'desc';
        query.order = current === 'desc' ? 'asc' : 'desc';
        return query;
      },
      sortFields() {
        let fields = ['created', 'updated'];
        const addFields = this.additionalSort;
        if (addFields) {
          fields = (typeof addFields === 'string' ? addFields.split(',') : addFields)
            .concat(fields);
        }
        const current = this.sort || this.$route.query.sort || fields[0];
        fields.forEach((name, i) => {
          const query = Object.assign({}, this.$route.query);
          query.sort = name;
          fields[i] = { query, name, current: name === current };
        });
        return fields;
      }
    },
    mounted() {
      this.mounted = true;
      this.updateMasonry();
    },
    beforeDestroy() {
      this.mounted = false;
      this.updateMasonry();
    },
    watch: {
      masonry() {
        this.$nextTick(this.updateMasonry);
      },
      items: {
        deep: true,
        handler() {
          this.$nextTick(() => {
            if (this.msnry) {
              this.msnry.reloadItems();
              this.msnry.layout();
            }
          });
        }
      }
    },
    methods: {
      updateMasonry() {
        if ((!this.masonry || !this.mounted) && this.msnry) {
          this.msnry.destroy();
          delete this.msnry;
        } else if (this.masonry && !this.msnry && this.mounted) {
          this.msnry = new Masonry(this.$refs.list, {
            itemSelector: '.resources-list-item',
            columnWidth: '.resources-list-width',
            percentPosition: true,
          });
          this.msnry.layout();
        }
      }
    }
  };
</script>


<style lang="scss" rel="stylesheet/scss">
  .resources-list-stream {
    .resources-list-item {
      margin: 32px auto 0;
      width: 100%;
      max-width: 500px;
    }
  }
  .resources-list-masonry {
    margin: 0 -8px;
    .resources-list-item {
      display: block;
      > .md-card {
        margin: 0 8px 16px;
      }
    }
    .resources-list-item,
    .resources-list-width {
      width: 100%;
      @media (min-width: 600px) {
        width: 50%;
      }
      @media (min-width: 1300px) {
        width: 33.333%;
      }
      @media (min-width: 1300px) {
        width: 25%;
      }
      @media (min-width: 1600px) {
        width: 20%;
      }
    }
  }
</style>