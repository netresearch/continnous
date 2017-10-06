<!--
@TODO: Exchange masonry with a column based grid (simply distribute items to columns)
-->

<template>
  <div :class="[
    'scroll-container',
    'resources-list-container',
    'resources-list-' + (masonry ? 'masonry' : 'stream'),
    'resources-list-' + columns + '-columns'
    ]">
    <div class="scroll-content">
      <md-toolbar class="md-dense md-transparent md-nav-bar">
        <slot name="title">
          <h2 class="md-title">{{title}}</h2>
        </slot>
        <div style="flex: 1"></div>
        <template v-if="period">
          <md-link-button
              class="md-icon-button resources-list-period-button"
              :to="getUrlPath({period: period.getPrevious().getId()})"
          ><md-icon>chevron_left</md-icon></md-link-button>
          <span class="resources-list-period">{{period.format()}}</span>
          <md-link-button
              class="md-icon-button resources-list-period-button"
              :to="getUrlPath({period: period.getNext().getId()})"
          ><md-icon>chevron_right</md-icon></md-link-button>
          <div style="flex: 1"></div>
        </template>
        <md-menu v-else md-direction="bottom left" md-size="4">
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
        <md-button class="md-icon-button" @click.native="masonry = !masonry">
          <md-icon>{{'view_' + (masonry ? 'stream' : 'quilt')}}</md-icon>
        </md-button>
        <md-button
            v-for="(key, isArchive) in ['personal', 'archive']"
            v-if="isArchive ? archiveEnabled : personalEnabled"
            :class="['md-icon-button', {'md-active': isArchive ? archive : personal}]"
            @click.native="Store.set('prefs.' + key, isArchive ? !archive : !personal); $router.push(getUrlPath(isArchive ? {archive: !archive} : {personal: !personal}))"
        >
          <md-icon>{{isArchive ? 'archive' : 'lock_outline'}}</md-icon>
          <md-tooltip>{{$t(key)}}</md-tooltip>
        </md-button>
      </md-toolbar>

      <div ref="list" :class="['resources-list']">
        <div :class="['resources-list-item', 'item-' + item.id]" v-for="item in items">
          <resource-item :item="item" @resource-image-shown="updateMasonry"></resource-item>
        </div>
      </div>

      <div class="resources-list-no-items" v-if="status === 1 && !items.length">
        <template v-if="archive">
          {{$t('archiveEmpty')}}
        </template>
        <template v-else>
          {{
          $t(personal ? 'youDontHave' : 'thereAreNo', {accusative: $t(type + '.' + (personal ? 'personal_' : '') + 'accusative')})
          + (period ? ' ' + $t('for') + ' ' + period.format() : '')
          + (Current.permissions[(personal ? 'personal_' : '') + type].write ? '' : '.')
          }}
          <template v-if="Current.permissions[(personal ? 'personal_' : '') + type].write">
            - {{$t('howAbout')}}
            <router-link :to="getUrlPath({create: true})">
              {{$t('addingOne', {accusative_one: $t(type + '.accusative_one')})}}</router-link>?
          </template>
        </template>
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<script>
  import Masonry from 'masonry-layout';
  import ResourceItem from './ListItem';
  import Current from '../../../models/Current';
  import Store from '../../../models/Store';

  export default {
    components: { ResourceItem },
    props: {
      items: [Array],
      status: Number,
      title: String,
      type: String,
      archive: Boolean,
      archiveEnabled: Boolean,
      personal: Boolean,
      personalEnabled: Boolean,
      sort: String,
      order: String,
      additionalSort: [String, Array],
      period: Object,
      masonryItemMinWidth: {
        type: Number,
        default: 300
      }
    },
    data() {
      return {
        mounted: false,
        masonry: true,
        columns: 1,
        Current,
        Store
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
        let fields = ['updated', 'created', 'rank'];
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
      /* global window */
      window.addEventListener('resize', this.updateColumns);
      this.updateColumns();
      this.$nextTick(() => {
        this.updateMasonry();
      });
    },
    beforeDestroy() {
      this.mounted = false;
      /* global window */
      window.removeEventListener('resize', this.updateColumns);
      this.updateMasonry();
    },
    watch: {
      masonry() {
        this.$nextTick(this.updateMasonry);
      },
      $route() {
        this.$nextTick(() => {
          this.updateColumns();
        });
      },
      columns() {
        this.$nextTick(() => {
          if (this.msnry) {
            this.msnry.layout();
          }
        });
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
        } else if (this.masonry) {
          if (!this.msnry && this.mounted) {
            this.msnry = new Masonry(this.$refs.list, {
              percentPosition: true,
            });
          }
          this.msnry.layout();
        }
      },
      updateColumns() {
        const list = this.$refs.list;
        const rect = list.getBoundingClientRect();
        this.columns = Math.max(0, Math.floor(
          rect.width / this.masonryItemMinWidth
        ));
      }
    }
  };
</script>


<style lang="scss" rel="stylesheet/scss">
  .resources-list-container {
    position: relative;
    > .md-toolbar {
    }
  }
  .resources-list {
    position: relative;
    z-index: 1;
  }
  .resources-list-period {
    text-transform: uppercase;
  }
  .resources-list-period-button {
    top: -2px;
  }
  .resources-list-stream {
    .resources-list-item {
      margin: 32px auto 0;
      width: 100%;
      max-width: 600px;
      &:first-child {
        margin-top: 16px;
      }
    }
  }
  .resources-list-masonry {
    .resources-list {
      margin: 0 -8px;
    }
    .resources-list-item {
      display: block;
      padding: 0 8px;
      margin-bottom: 16px;
      > .md-card {
        display: block;
      }
    }
    .resources-list-item {
      width: 100%;
    }
    &.resources-list-2-columns .resources-list-item {
      width: 50%;
    }
    &.resources-list-3-columns .resources-list-item {
      width: 33.3333%;
    }
    &.resources-list-4-columns .resources-list-item {
      width: 25%;
    }
    &.resources-list-5-columns .resources-list-item {
      width: 20%;
    }
    &.resources-list-6-columns .resources-list-item {
      width: 16.6667%;
    }
    &.resources-list-7-columns .resources-list-item {
      width: 14.2857%;
    }
  }
  .resources-list-no-items {
    position: absolute;
    top: 15%;
    left: 0;
    width: 100%;
    text-align: center;
  }
</style>