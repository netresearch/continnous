<template>
  <resource-list
      :title="$t('search')"
      :type="type"
      :items="items"
      :personal="personal"
      additional-sort="_score"
  >
    <div class="search-form" :class="{'search-form-focused': searchFocus}" slot="title">
      <md-icon>search</md-icon>
      <input
          ref="searchInput"
          type="text"
          :value="q"
          :placeholder="$t('search')"
          @focus="searchFocus = true"
          @blur="searchFocus = false"
          @input="handleInput">
      <md-icon @click.native.stop="handleInput(false)">clear</md-icon>
    </div>
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
        Current,
        searchFocus: false
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
    mounted() {
      if (!this.q) {
        this.$refs.searchInput.focus();
      }
    },
    methods: {
      handleInput(cleared) {
        const path = this.getUrlPath({ search: true });
        if (cleared === false) {
          this.$router.replace(this.previousRoute || '/' + this.getUrlPath());
        } else {
          const q = this.$refs.searchInput.value;
          const query = Object.assign({}, this.$route.query);
          if (q) {
            query.q = q;
          } else if (query.q) {
            delete query.q;
          }
          if (this.$route.path.substr(0, path.length) !== path) {
            this.previousRoute = { path: this.$route.path, query: this.$route.query };
            this.$router.push({ path, query });
          } else {
            this.$router.replace({ query });
          }
        }
      },
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

<style lang="scss" rel="stylesheet/scss">
  .search-form {
    height: 48px;
    margin-bottom: -1px;
    display: flex;
    flex-flow: row;
    flex: 1;
    transition: background 100ms ease-in, width 100ms ease-out;
    cursor: pointer;
    border-top: 2px solid transparent;
    border-bottom: 2px solid transparent;
    &.search-form-focused {
      border-bottom: 2px solid rgba(#000, 0.48);
    }
    .md-icon {
      margin-left: 8px;
      margin-right: 16px;
    }
    input {
      flex: 1;
      background: transparent;
      border: none;
      font-size: inherit;
      cursor: text;
      &:focus {
        border: none;
        outline: none;
      }
      color: inherit !important;
      &::-webkit-input-placeholder {
        color: inherit !important;
      }
      &:-moz-placeholder {
        color: inherit !important;
      }
      &::-moz-placeholder {
        color: inherit !important;
      }
      &:-ms-input-placeholder {
        color: inherit !important;
      }
    }
  }
</style>