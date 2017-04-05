<template>
  <md-autocomplete
      ref="autocomplete"
      :provider="search"
      :filter="filter"
      :match-case="matchCase"
      @selected="onTagSelected"
  >
    <template slot="input" scope="autocomplete">
      <md-chips-input
          :md-static="disabled"
          ref="chipsInput"
          @change="onChipsChange"
          @input-input="onChipsChange"
          @enter="$refs.chipsInput.addChip(); $refs.chipsInput.$refs.input.$el.blur()"
          v-model="tags">
        <template scope="chip">{{chip.value}}</template>
      </md-chips-input>
    </template>
    <template slot="flyout" scope="autocomplete">
      <div @click="$refs.chipsInput.addChip()" class="md-autocomplete-flyout-item resource-tags-input-flyout-item" v-if="autocomplete.currentResults && autocomplete.currentResults.indexOf(autocomplete.q) < 0">
        <strong>{{autocomplete.q}}</strong> <span class="md-caption">(new keyword)</span>
      </div>
    </template>
  </md-autocomplete>
</template>

<script>
  import Flashlight from '../../../models/Flashlight';

  export default {
    props: {
      value: Array,
      disabled: Boolean,
      organization: Object,
      permissions: Object,
      matchCase: Boolean
    },
    computed: {
      tags() {
        const tags = this.value || [];
        if (this.$refs.chipsInput && this.$refs.chipsInput.currentChip) {
          const index = tags.indexOf(this.$refs.chipsInput.currentChip);
          if (index > -1) {
            tags.splice(index, 1);
          }
        }
        return tags;
      }
    },
    methods: {
      getTagIncludePattern(tag) {
        let sword = tag.trim().replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
        if (!this.matchCase) {
          const origSword = sword;
          sword = '';
          for (let i = 0; i < origSword.length; i++) {
            const lc = origSword[i].toLowerCase();
            const uc = origSword[i].toUpperCase();
            sword += lc === uc ? lc : '[' + lc + uc + ']';
          }
        }
        return sword + '.*';
      },
      search(tag) {
        return new Promise((resolve) => {
          if (!this.flashlight) {
            this.flashlight = new Flashlight(this.organization, this.permissions);
            this.flashlight.ignoreSubsequents();
          }
          const search = {
            body: {
              size: 0,
              aggs: {
                tags: {
                  terms: {
                    field: 'tags.keyword',
                    include: this.getTagIncludePattern(tag)
                  }
                }
              }
            }
          };
          this.flashlight.search(search, '*').then((results) => {
            const tags = [];
            results.forEach((result) => {
              const buckets = result.aggregations.tags.buckets;
              if (buckets) {
                buckets.forEach((bucket) => {
                  if (tags.indexOf(bucket.key) < 0) {
                    tags.push(bucket.key);
                  }
                });
              }
            });
            resolve(tags);
          });
        });
      },
      filter(tag) {
        return !this.value || this.value.indexOf(tag) < 0;
      },
      onChipsChange(tags) {
        const allTags = tags.slice(0);
        if (this.$refs.chipsInput.currentChip) {
          allTags.push(this.$refs.chipsInput.currentChip);
        }
        this.$emit('change', allTags.length > 0 ? allTags : null);
        this.$emit('input', allTags.length > 0 ? allTags : null);
      },
      onTagSelected(tag, event) {
        event.propagate = false;
        this.$refs.chipsInput.currentChip = tag;
        this.$refs.chipsInput.addChip();
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-tags-input-flyout-item {
    border-top: 1px solid rgba(#000, 0.12);
    &:first-child {
      border: none;
    }
  }
</style>