<template>
  <div class="resource-scoring">
    <div class="resource-scoring-title">
      <span :class="{'resource-scoring-title-tabs': average}">
        <template v-if="showAverage !== undefined">
          <span v-if="average" :class="{'resource-scoring-title-current': showAverage}" @click="showAverage = true">
            {{$t('scoring.all', {numScorings})}}
          </span>
          <span :class="{'resource-scoring-title-current': !showAverage}" @click="showAverage = false">
            {{$t('scoring.title')}}
          </span>
        </template>
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
          <md-tooltip md-direction="bottom">{{$t('scoring.help.' + key, {organization: Current.organization.name})}}</md-tooltip>
        </span>
      </dt>
      <dd>
        <md-slider
            :value="showAverage ? average[key] : values[key]"
            :disabled="showAverage"
            @change="updateCriterion(key, $event)"
            max="5"
            :name="key"
            :step="showAverage ? 0.01 : 1"
            tooltips></md-slider>
      </dd>
    </dl>
  </div>
</template>

<script>
  import Child from '../../../form/child';
  import Firebase from '../../../../firebase';
  import mixin from '../mixin';
  import Current from '../../../../models/Current';
  
  export default {
    extends: Child,
    props: ['item', 'isNew', 'criteria'],
    mixins: [mixin],
    data() {
      return {
        values: {},
        average: null,
        showAverage: undefined,
        numScorings: 0,
        Current
      };
    },
    watch: {
      'item.id': {
        immediate: true,
        handler(id) {
          if (this.ref) {
            this.ref.off('value');
          }
          this.showAverage = undefined;
          if (id) {
            this.ref = Firebase.database().ref(
              '/scorings/organizations/' + Current.organization.key + '/' + id
            );
            this.ref.on('value', (sn) => {
              this.values = {};
              this.average = null;
              this.numScorings = 0;
              const allValues = {};
              let hasOtherScorings = false;
              let hasUserScoring = false;
              sn.forEach((csn) => {
                this.numScorings++;
                if (csn.key === Current.user.uid) {
                  this.values = csn.val() || {};
                  hasUserScoring = true;
                } else {
                  hasOtherScorings = true;
                }
                csn.forEach((ccsn) => {
                  if (!allValues[ccsn.key]) {
                    allValues[ccsn.key] = [];
                  }
                  allValues[ccsn.key].push(ccsn.val());
                });
              });
              if (hasUserScoring && hasOtherScorings) {
                const average = {};
                this.criteria.forEach((criterion) => {
                  if (allValues[criterion]) {
                    average[criterion] =
                      allValues[criterion].reduce((value, sum) => value + sum, 0)
                      / allValues[criterion].length;
                  }
                });
                this.average = average;
                if (this.showAverage === undefined) {
                  this.showAverage = true;
                }
              } else {
                this.showAverage = false;
              }
            });
          }
        }
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
      onFormSave(values, beforeSave) {
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
        if (Current.user.elevate) {
          values._elevate = Current.user.elevate;
        }
        return this.ref.child(Current.user.uid).set(values);
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-scoring {
    .resource-scoring-title {
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      color: rgba(0, 0, 0, 0.54);
      margin: -4px 0 -4px;
      > span {
        flex: 1 0 auto;
        &.resource-scoring-title-tabs {
          span {
            padding-left: 10px;
            padding-right: 10px;
            &:not(.resource-scoring-title-current) {
              cursor: pointer;
            }
            &.resource-scoring-title-current {
              cursor: default;
              border-bottom: 2px solid rgba(0, 0, 0, 0.25);
              padding-bottom: calc(1em - 1px);
            }
          }
        }
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
        min-width: 80px;
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