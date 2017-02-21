<template>
  <md-button
      :class="{'md-primary': action === 'save'}"
      :disabled="!form || !form.hasChanged(action !== 'save', recursive)"
      @click="action === 'save' ? form.save(recursive) : form.reset(false, recursive)"
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
      recursive: Boolean,
      icon: String
    }
  };
</script>