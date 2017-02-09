<template>
  <div>
    <form-element type="md-select" name="dueTime" :label="$t('fields.period.label')" :placeholder="$t('fields.period.placeholder')">
      <md-option v-for="(period, i) in periods" :value="period.end" :disabled="i === 0">{{period.format()}}</md-option>
    </form-element>
  </div>
</template>

<script>
  import Child from '../../../../form/child';
  import FormElement from '../../../../form/Element';
  import Period from '../../../../../models/Period';

  export default {
    extends: Child,
    components: { FormElement },
    computed: {
      periods() {
        let period = new Period();
        const periods = [];
        for (let i = 0; i < 4; i++) {
          periods.push(period);
          period = period.getNext();
        }
        return periods;
      }
    }
  };
</script>