<template>
  <div class="resource-detail-publish-control">
    <template v-if="isNew || form && form.hasChanged(true)">
      <p class="md-caption" v-if="!isNew">
        <md-icon>{{isNew ? 'bubble_chart' : 'info_outline'}}</md-icon>
        <span>{{$t(isNew ? 'detail.newSaveHint' : 'detail.saveHint')}}</span>
      </p>
      <form-button action="save" :class="['md-raised', 'md-primary', {'resource-detail-full-button': isNew}]"></form-button>
      <form-button action="reset" v-if="!isNew"></form-button>
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
      isNew: Boolean,
      organization: Object
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-detail-publish-control {
    .md-button {
      margin-top: 0;
      margin-bottom: 18px;
    }
    .md-button.md-primary {
      &.resource-detail-full-button {
        margin-left: 0;
        width: 100%;
      }
    }
  }
</style>