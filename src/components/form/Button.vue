<template>
  <md-button
      :class="{'md-primary': action === 'save'}"
      :disabled="!form || !form.hasChanged(action !== 'save')"
      @click="form[action]()"
  >{{$t('actions.' + action)}}</md-button>
</template>

<script>
  import Child from './child';

  export default {
    extends: Child,
    props: {
      action: {
        type: String,
        required: true
      }
    }
  };
</script>