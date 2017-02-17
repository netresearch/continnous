<template>
  <div class="resource-scoring">
    <template v-if="criteria && criteria.length">
      <md-card>
        <md-card-content>
          <div class="resource-scoring-title">
            <span>
            {{$t('scoring.title')}}
            </span>
            <md-icon>
              help_outline
              <md-tooltip md-direction="bottom">{{$t('scoring.info')}}</md-tooltip>
            </md-icon>
          </div>
          <hr>
          <dl class="resource-scoring-criterion-container" v-for="key in criteria">
            <dt>
              <span>
                {{$t('scoring.criteria.' + key)}}
                <md-tooltip md-direction="bottom">{{$t('scoring.help.' + key)}}</md-tooltip>
              </span>
            </dt>
            <dd>
              <md-slider :value="values[key]" @change="updateCriterion(key, $event)" max="5" :name="key" :step="1" tooltips></md-slider>
            </dd>
          </dl>
        </md-card-content>
      </md-card>
    </template>
  </div>
</template>

<script>
  import Child from '../../../form/child';
  import auth from '../../../../auth';
  import Config from '../../../../models/Config';
  import Firebase from '../../../../firebase';
  import mixin from '../mixin';
  
  export default {
    extends: Child,
    props: ['organization', 'type', 'item', 'isNew'],
    mixins: [mixin],
    data() {
      return {
        values: {}
      };
    },
    watch: {
      'item.id': {
        immediate: true,
        handler(id) {
          if (this.ref) {
            this.ref.off('value');
          }
          if (id) {
            this.ref = Firebase.database().ref(
              '/scorings/organizations/' + this.organization.key + '/' + id + '/' + auth.user.uid
            );
            this.ref.on('value', (sn) => {
              this.values = sn.val() || {};
            });
          }
        }
      }
    },
    computed: {
      criteria() {
        return this.type ? Config.resources[this.type].scoring : [];
      }
    },
    mounted() {
      this.form.$on('before-save', this.onFormSave);
    },
    beforeDestroy() {
      this.form.$off('before-save', this.onFormSave);
    },
    methods: {
      updateCriterion(key, value) {
        this.values[key] = value;
        if (this.ref && !this.isNew) {
          this.save().then(() => {
            this.updateRank(this.item);
          });
        }
      },
      onFormSave(beforeSave) {
        if (this.isNew) {
          beforeSave.push(new Promise((resolve, reject) => {
            this.save().then(resolve, reject);
          }));
        }
      },
      save() {
        /* eslint-disable no-underscore-dangle */
        const values = {};
        this.criteria.forEach((criterion) => {
          values[criterion] = this.values[criterion] || 0;
        });
        if (auth.user.elevate) {
          values._elevate = auth.user.elevate;
        }
        return this.ref.set(values);
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-scoring {
    margin-top: 32px;
    .resource-scoring-title {
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      color: rgba(0, 0, 0, 0.54);
      margin: -4px 0 -4px;
      span {
        flex: 1 0 auto;
      }
      .md-icon {
        cursor: help;
      }
    }
    .md-card .md-card-content:last-child {
      padding-bottom: 16px;
    }
    .resource-scoring-criterion-container {
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      dt {
        min-width: 70px;
        margin: 0;
        margin-right: 16px;
        span {
          border-bottom: 1px dashed rgba(0, 0, 0, 0.25);
          cursor: help;
        }
      }
      dd {
        flex: 1 0 auto;
        margin: 0;
        .md-slider {
          padding: 8px 0;
        }
      }
    }
  }
</style>