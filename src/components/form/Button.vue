<template>
  <md-button
      :class="{'md-primary': action === 'save'}"
      :disabled="!form || action !== 'cancel' && !form.hasChanged(action !== 'save', recursive)"
      @click="action === 'save' ? form.save(recursive) : (action === 'reset' ? form.reset(false, recursive) : form.protector.cancel(recursive))"
  >
    <slot>
      <md-icon v-if="icon">{{icon}}</md-icon> {{$t('actions.' + action)}}
    </slot>
  </md-button>
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