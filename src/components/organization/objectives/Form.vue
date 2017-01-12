<template>
  <dialog-form
      class="form-base-dialog"
      :firebase-path="'/resources/organizations/' + organization.key + '/' + (personal ? auth.user.uid : 'organization') + '/objectives/{new}'"
      :value="{creator: auth.user.uid}"
      :keys="personal ? [] : ['creator']"
  >
    <template slot="title" scope="form">
      <form-element name="title" md-inline :label="$t('objectives.title.placeholder')">
        <md-input :value="form.values.title"></md-input>
      </form-element>
    </template>

    <template scope="form">
      <md-checkbox v-model="personal">{{$t('objectives.personal.label')}}</md-checkbox>
    </template>
  </dialog-form>
</template>

<script>
  import DialogForm from '../../form/Dialog';
  import auth from '../../../auth';

  export default {
    props: ['organization'],
    components: { DialogForm },
    data() {
      return {
        auth,
        personal: false
      };
    }
  };
</script>