<template>
  <resource-list
      :title="$t('search')"
      :type="type"
      :items="items"
      :personal="personal"
      additional-sort="_score"
  >
    <router-link
        slot="buttons"
        v-for="result in results"
        :to="{
          path: getUrlPath(type === result.resource && personal === result.personal ? {search: true, type: null, personal: null} : {search: true, type: result.resource, personal: result.personal}),
          query: $route.query
        }"
        class="md-button"
    >{{$tc(result.resource + '.' + (result.personal ? 'personal' : 'title'), 2)}}</router-link>

    <router-view></router-view>
  </resource-list>
</template>

<script>
  import Flashlight from '../../../models/Flashlight';
  import mixin from './mixin';
  import ResourceList from './List';
  import Item from '../../../models/Item';
  import Current from '../../../models/Current';

  export default {
    mixins: [mixin],
    components: { ResourceList },
    data() {
      return {
        flashlight: new Flashlight(),
        results: undefined,
        items: undefined,
        type: undefined,
        personal: false,
        sort: '_score',
        order: 'desc',
        q: undefined,
        Current
      };
    },
    watch: {
      $route: {
        immediate: true,
        handler: 'search'
      },
      'Current.organization': 'search',
      'Current.user': 'search',
      'Current.permissions': {
        deep: true,
        handler: 'search'
      },
    },
    methods: {
      search(reason) {
        this.$nextTick(() => {
          const query = this.$route.query;
          if (this.$route.params.id && this.q) {
            return;
          }
          let search = false;
          ['sort', 'order', 'q'].forEach((key) => {
            if (query[key] && query[key] !== this[key]) {
              this[key] = query[key];
              search = true;
            }
          });
          if (this.q) {
            if (search || reason && Object.values(Current).indexOf(reason) > -1) {
              this.flashlight.search({ q: this.q, sort: this.sort + ':' + this.order }, true, '*').then(
                (results) => {
                  this.results = results;
                  if (this.type && !results.find(
                          result => result.resource === (this.personal ? 'personal_' : '') + this.type
                      )) {
                    this.$router.replace({ path: '/' + Current.organization.key + '/search', query });
                    return;
                  }
                  this.updateItems();
                  this.$emit('search-results', results);
                },
                (e) => {
                  if (!e.error || e.error.indexOf('Failed to parse query') < 0) {
                    throw e;
                  }
                }
              );
            }
          } else {
            this.results = undefined;
            this.items = undefined;
          }
          const params = this.$route.params;
          if (params.type !== this.type || !!params.personal !== this.personal) {
            this.type = params.type;
            this.personal = !!params.personal;
            if (this.results) {
              this.updateItems();
            }
          }
        });
      },
      updateItems() {
        const order = {};
        const items = [];
        this.results.forEach((result) => {
          const resource = result.resource;
          const personal = result.personal;
          result.hits.forEach((hit) => {
            /* eslint-disable no-underscore-dangle */
            if (!this.type || (this.type === resource && this.personal === personal)) {
              const item = new Item(resource, hit._id, hit._source, false, personal);
              order[item.id] = this.sort === '_score' ? hit._score : item[this.sort];
              items.push(item);
            }
          });
        });
        items.sort((a, b) => (order[a.id] - order[b.id]) * (this.order === 'desc' ? -1 : 1));
        this.items = items;
      }
    }
  };
</script>