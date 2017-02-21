<template>
  <div class="resource-results">
    <template v-if="show">
      <card-form
        :keys="['results']"
        :validate="{results: filterAndValidate}"
        :disabled="isNew || !editable || !edit"
        sub
        ref="form"
      >
        <template scope="form">
          <div class="resource-results-title">
            <span>
            {{$t('results.title')}}
            </span>
            <md-icon v-if="!isNew && editable && !edit" @click.native="edit = true">build</md-icon>
          </div>
          <hr>
          <div class="resource-result-form" v-if="edit || isNew">
            <div class="resource-result-form-result-list">
              <div class="resource-result" v-for="(result, i) in form.values.results || []">
                <md-menu>
                  <md-button class="md-icon-button md-primary" md-menu-trigger>
                    <md-icon :title="$t('results.' + result.type)">{{types[result.type].icon}}</md-icon>
                  </md-button>
                  <md-menu-content>
                    <md-menu-item
                        v-for="(type, key) in types"
                        @selected="onChange(i, 'type', key)"
                        :disabled="key === result.type">
                      <md-icon>{{type.icon}}</md-icon>
                      <span>{{$t('results.' + key)}}</span>
                    </md-menu-item>
                  </md-menu-content>
                </md-menu>
                <div class="resource-result-fields">
                  <md-input-container :class="['resource-result-title', {'md-input-invalid': errors[i] && errors[i].title}]">
                    <label>{{$t('fields.title')}}</label>
                    <md-input required :value="result.title" @input="onChange(i, 'title', $event)"></md-input>
                  </md-input-container>
                  <div class="resource-result-range">
                    <md-input-container
                        v-for="key in ['initial', 'target']"
                        v-if="types[result.type][key]"
                        :class="{'md-input-invalid': errors[i] && errors[i][key]}"
                    >
                      <label>{{$t('fields.' + key)}}</label>
                      <md-input required :value="result[key]" @input="onChange(i, key, $event)"></md-input>
                    </md-input-container>
                  </div>
                </div>
                <md-icon @click.native="removeResult(i)">clear</md-icon>
                <div class="resource-result-sort" v-if="form.values.results.length > 1">
                  <md-icon v-if="i > 0" @click.native="moveResult(i, -1)">arrow_drop_up</md-icon>
                  <md-icon v-if="i < form.values.results.length - 1" @click.native="moveResult(i, 1)">arrow_drop_down</md-icon>
                </div>
              </div>
            </div>
            <div class="resource-result-add">
              <span class="md-link" @click="addResult()">{{$t('results.add')}}</span>
            </div>
          </div>
        </template>
        <md-button @click="$refs.form.reset(); edit = false;" slot="secondaryButtons">{{$t('actions.cancel')}}</md-button>
      </card-form>
    </template>
  </div>
</template>

<script>
  import auth from '../../../../auth';
  import Config from '../../../../models/Config';
  import mixin from '../mixin';
  import CardForm from '../../../form/Card';

  export default {
    components: { CardForm },
    props: ['organization', 'type', 'item', 'isNew'],
    mixins: [mixin],
    data() {
      return {
        edit: false,
        add: false,
        errors: [],
        types: {
          check: {
            icon: 'checkbox'
          },
          value: {
            icon: 'timeline',
            initial: true,
            target: true
          },
          money: {
            icon: 'toll',
            initial: true,
            target: true
          },
          scorings: {
            icon: 'thumbs_up_down',
            target: true
          },
          ideas: {
            icon: 'lightbulb_outline',
            target: true
          }
        }
      };
    },
    watch: {
      'item.id': {
        handler() {
          this.edit = false;
        }
      }
    },
    computed: {
      show() {
        return this.type ? Config.resources[this.type].results : false;
      },
      editable() {
        return this.isNew || (this.item && auth.user.uid === this.item.creator);
      }
    },
    methods: {
      onChange(i, field, value) {
        const results = this.$refs.form.values.results.slice(0);
        results[i] = Object.assign({}, results[i]);
        const old = results[i][field];
        results[i][field] = value;
        if (field === 'type') {
          ['initial', 'target'].forEach((key) => {
            if (this.types[value][key]) {
              if (!this.types[old][key]) {
                this.$nextTick(() => {
                  this.onChange(i, key, key === 'initial' ? '0' : null);
                });
              }
            } else {
              delete results[i][key];
            }
            if (!results[i].title || results[i].title.replace(/^\s*(.*)\s*$/, '$1').length < 1) {
              delete results[i].title;
              this.$nextTick(() => {
                this.onChange(i, 'title', '');
              });
            }
          });
        }
        this.$refs.form.onChange('results', results);
      },
      filterAndValidate(results) {
        const errors = [];
        let hasErrors = false;
        results.forEach((result, i) => {
          errors[i] = {};
          Object.keys(result).forEach((key) => {
            let error = false;
            if (key === 'title') {
              result.title = result.title.replace(/^\s*(.*)\s*$/, '$1');
              error = result.title.length < 1;
            } else if (key !== 'type') {
              if (typeof result[key] !== 'string') {
                hasErrors = true;
              } else {
                result[key] = result[key].replace(',', '.').replace(/[^0-9.]/, '');
                error = !result[key].match(/[0-9]+(\.[0-9]+)?/);
              }
            }
            if (error) {
              errors[i][key] = true;
              hasErrors = true;
            }
          });
        });
        this.errors = errors;
        return !hasErrors;
      },
      removeResult(i) {
        const results = this.$refs.form.values.results;
        results.splice(i, 1);
        this.$refs.form.onChange('results', results);
      },
      moveResult(i, direction) {
        const results = this.$refs.form.values.results;
        const result = results[i];
        results.splice(i, 1);
        results.splice(i + direction, 0, result);
        this.$refs.form.onChange('results', results);
      },
      addResult() {
        const form = this.$refs.form;
        if (!form.values.results) {
          form.$set(form.values, 'results', []);
        }
        const results = form.values.results;
        const type = results.length ? results[results.length - 1].type : 'check';
        results.push({ type, title: '' });
        this.$nextTick(() => {
          this.$el
            .querySelector('.resource-result-form-result-list .resource-result:last-child')
            .querySelector('.resource-result-title input').focus();
        });
        this.$refs.form.onChange('results', results);
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-results {
    .md-card {
      margin-top: 32px;
      .md-card-content:last-child {
        padding-bottom: 16px;
      }
      .resource-results-title {
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
    }
    .resource-result {
      padding-top: 10px;
      display: flex;
      flex-flow: row wrap;
      align-items: flex-start;
      .md-menu > .md-button {
        margin-left: 0;
        margin-right: 0;
        .md-icon {
          left: 0;
          transform: translate(0, -50%);
        }
        &:after {
          margin-top: 2px;
          position: absolute;
          top: 50%;
          right: 0;
          transform: translateY(-50%) scaleY(0.45) scaleX(0.85);
          transition: all 0.15s linear;
          content: "\25BC";
          color: rgba(#000, 0.56);
        }
      }
      .resource-result-fields {
        flex: 1;
        margin-left: 10px;
        > .md-input-container {
          margin: -12px 0 24px;
        }
        .resource-result-range {
          display: flex;
          flex-flow: row wrap;
          align-items: center;
          width: 100%;
          .md-input-container {
            width: auto;
            flex: 1;
            min-width: 50px;
            margin-left: 16px;
            margin-top: -12px;
            &:first-child {
              margin-left: 0;
            }
          }
        }
      }
      > .md-icon {
        margin: 8px 0 0 6px;
      }
      > .md-icon,
      .resource-result-sort .md-icon {
        color: rgba(#000, 0.56);
        cursor: pointer;
        transition: all 0.24s;
        &:hover {
          color: rgba(#000, 0.9);
        }
      }
      .resource-result-sort {
        margin-top: 8px;
        min-height: 24px;
        display: inline-flex;
        flex-flow: column;
        .md-icon {
          min-height: 12px;
          height: 12px;
          display: block;
          line-height: 12px;
        }
      }
    }
  }
</style>