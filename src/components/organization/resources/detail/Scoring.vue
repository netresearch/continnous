<template>
  <div class="resource-scoring">
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
          <md-tooltip md-direction="bottom">{{$t('scoring.help.' + key, {organization: Current.organization.name})}}</md-tooltip>
        </span>
      </dt>
      <dd>
        <md-slider :value="values[key]" @change="updateCriterion(key, $event)" max="5" :name="key" :step="1" tooltips></md-slider>
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
          if (id) {
            this.ref = Firebase.database().ref(
              '/scorings/organizations/' + Current.organization.key + '/' + id + '/' + Current.user.uid
            );
            this.ref.on('value', (sn) => {
              this.values = sn.val() || {};
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
        return this.ref.set(values);
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