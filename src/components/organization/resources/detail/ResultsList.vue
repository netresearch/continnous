<template>
  <div class="resource-results-list">
    <div class="md-caption" v-if="!results.length">{{$t('results.none')}}</div>
    <div class="resource-result" v-for="result in results">
      <md-icon class="md-primary">{{types[result.type].icon}}</md-icon>
      <div class="resource-result-title">{{result.title}}</div>
      <div class="resource-results-value">
        <md-checkbox :value="result.value" v-if="result.type === 'check'"></md-checkbox>
        <template v-else>
          {{result.value || result.initial}} / {{result.target}}
        </template>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      results: Array,
      types: Object
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-results-list {
    .resource-result {
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      margin-bottom: 16px;
      &:last-child {
        margin-bottom: 0;
      }
      .md-checkbox {
        margin: 0 2px;
      }
      .resource-result-title {
        flex: 1;
        margin-left: 6px;
      }
    }
  }
</style>