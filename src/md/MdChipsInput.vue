<!-- same as mdChips but without md-input-container and other separator (, only) -->

<template>
  <div class="md-chips md-chips-input" :class="[themeClass, classes]">
    <md-chip
        v-for="chip in this.value"
        :md-deletable="!mdStatic"
        :disabled="disabled"
        @delete="deleteChip(chip)"
        @keydown.native.delete="deleteChip(chip)">
      <slot :value="chip"></slot>
    </md-chip>
    <md-input
        v-show="!mdStatic && (!selectedChips || selectedChips.length < mdMax)"
        v-model="currentChip"
        :type="mdInputType"
        :placeholder="mdInputPlaceholder"
        :id="inputId"
        :name="mdInputName"
        :disabled="disabled"
        @keydown.native.backspace="deleteLastChip"
        @keydown.native.prevent.188="addChip"
        @keydown.native.prevent.enter="$emit('enter')"
        @input.native="$emit('input-input', selectedChips)"
        tabindex="0"
        ref="input">
    </md-input>
  </div>
</template>

<script>
import Vue from 'vue';

export default {
  extends: Vue.component('md-chips').options,
};
</script>

<style lang="scss" rel="stylesheet/scss">
  .md-chips-input {
    width: 100%;
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    .md-chip {
      position: relative;
      top: 4px;
    }
  }
</style>