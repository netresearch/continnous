<template>
  <md-editor
      ref="editor"
      :value="value"
      :placeholder="placeholder"
      :disabled="disabled"
      @change="$emit('change', $event)"
      @input="$emit('input', $event)"
  >
    <md-mentions
        :providers="{'@': searchUsers}"
        :normalize="{'@': normalizeUser}"
    >
      <template scope="item">
        <avatar :user="item.value"></avatar>
      </template>
      <template slot="current" scope="item">
        <avatar :uid="item.id" :organization="organization"></avatar>
      </template>
    </md-mentions>
  </md-editor>
</template>

<script>
  import searchMixin from './mixins/search';
  import Avatar from '../../Avatar';

  export default {
    components: { Avatar },
    mixins: [searchMixin],
    props: {
      value: String,
      placeholder: String,
      disabled: Boolean,
    },
    methods: {
      normalizeUser(user) {
        return {
          id: user.uid,
          text: user.displayName
        };
      }
    },
    mounted() {
      const container = this.$parent.$parent.$refs.container;
      if (container) {
        this.$refs.editor.parentContainer = container;
      }
    }
  };
</script>