<template>
  <div class="resource-detail-publish-control">
    <template v-if="isNew || form && form.hasChanged(true)">
      <p class="md-caption">
        <md-icon>info_outline</md-icon>
        <span>{{$t(isNew ? 'detail.newSaveHint' : 'detail.saveHint')}}</span>
      </p>
      <form-button action="save" class="md-raised md-primary"></form-button>
      <form-button action="reset"></form-button>
    </template>
    <p class="md-caption" v-else>
      <md-icon>info_outline</md-icon>
      <span>{{$t('detail.editHint')}}</span>
    </p>
  </div>
</template>

<script>
  import Child from '../../../form/child';
  import FormButton from '../../../form/Button';

  export default {
    extends: Child,
    components: { FormButton },
    props: {
      isNew: Boolean
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-detail-publish-control {
    .md-button.md-primary {
      margin-left: 22px;
    }
  }
</style>