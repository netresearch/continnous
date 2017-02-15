<template>
  <div>
    <div class="idea-form-criterion-title">{{$t('ideas.scoring')}}</div>
    <dl class="idea-form-criterion-container" v-for="key in ['strategy', 'need', 'impact', 'feasability', 'feel']">
      <dt>
        <span>
          {{$t('ideas.criteria.' + key)}}
          <md-tooltip md-direction="bottom">{{$t('ideas.criteriaHelp.' + key)}}</md-tooltip>
        </span>
      </dt>
      <dd>
        <form-element type="md-slider" max="5" :name="key" :step="1" tooltips naked>
        </form-element>
      </dd>
    </dl>
  </div>
</template>

<style lang="scss" rel="stylesheet/scss">
  .idea-form-criterion-title {
    color: rgba(0, 0, 0, 0.54);
    font-size: 12px;
    margin: 18px 0 -8px;
  }
  .idea-form-criterion-container {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    &:last-child {
      margin-bottom: 16px;
    }
    dt {
      min-width: 70px;
      margin: 0;
      margin-right: 16px;
      color: rgba(0, 0, 0, 0.54);
      span {
        border-bottom: 1px dashed rgba(0, 0, 0, 0.25);
        cursor: default;
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
</style>