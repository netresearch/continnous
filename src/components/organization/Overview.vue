<template>
  <div class="scroll-container">
    <md-toolbar class="md-dense">
      <h2 class="md-title">{{$t('overview.title')}}</h2>
    </md-toolbar>
    <div class="scroll-content">
      <md-layout class="overview-section">
        <div class="overview-latest">
        </div>
        <md-layout md-column class="overview-journal">
          <p class="md-caption">What's hot</p>
          <md-card>
            <md-card-content style="padding-bottom: 16px;">
              <journal :organization="organization"></journal>
            </md-card-content>
          </md-card>
        </md-layout>
        <md-layout md-column class="overview-latest" v-for="resources in [['objectives', 'ideas'], ['insights', 'roadmaps']]">
          <template v-for="resource in resources" v-if="latestItems[resource]">
            <p class="md-caption">
              {{$t(resource + '.latest')}} {{$tc(resource + '.title', 1)}}
              <template v-if="config[resource].periodical">
                in {{period.format()}}
              </template>
            </p>
            <resource-item
                :type="resource"
                :item="latestItems[resource]"
                :permissions="permissions"
                :organization="organization"
            ></resource-item>
          </template>
        </md-layout>
      </md-layout>
    </div>
  </div>
</template>

<script>
  import Journal from './Journal';
  import mixin from './resources/mixin';
  import ResourceItem from './resources/ListItem';
  import Config from '../../models/Config';
  import Period from '../../models/Period';

  export default {
    components: { Journal, ResourceItem },
    mixins: [mixin],
    props: {
      organization: Object,
      permissions: Object
    },
    data() {
      const latestItems = {};
      Object.keys(Config.resources).forEach((resource) => {
        latestItems[resource] = undefined;
      });
      return { latestItems, period: new Period(), config: Config.resources };
    },
    created() {
      Object.keys(Config.resources).forEach((resource) => {
        let ref = this.getFirebaseRef(false, undefined, false, resource);
        if (Config.resources[resource].periodical) {
          ref = ref.orderByChild('dueTime')
            .startAt(this.period.start)
            .endAt(this.period.end);
        } else {
          ref = ref.orderByKey();
        }
        ref.on('value', (sn) => {
          sn.forEach((snc) => {
            this.latestItems[resource] = this.createItem(snc.key, snc.val());
          });
        }, () => {
          this.latestItems[resource] = undefined;
        });
      });
    },
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .overview-latest {
    margin: 0 16px;
    p:not(:first-child) {
      margin-top: 24px;
    }
  }
  .overview-journal {
    margin-left: -16px;
    margin-right: 16px;
  }
</style>