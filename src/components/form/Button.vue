<template>
  <md-button
      :class="{'md-primary': action === 'save'}"
      :disabled="!form || !form.hasChanged(action !== 'save')"
      @click="form[action]()"
  ><md-icon v-if="icon">{{icon}}</md-icon> {{$t('actions.' + action)}}</md-button>
</template>

<script>
  import Child from './child';

  export default {
    extends: Child,
    props: {
      action: {
        type: String,
        required: true
      },
      icon: String
    }
  };
</script>