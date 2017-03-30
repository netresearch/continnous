<template>
  <div class="resource-detail-form">
      <form-element
          type="md-textarea"
          md-inline name="title"
          :label="$t('fields.title')"
          :placeholder="$t(type + '.titlePlaceholder')"
          md-inline
      ></form-element>

      <form-element
          type="md-textarea"
          name="subtitle"
          :label="$t('fields.subtitle.label')"
          :placeholder="$t('fields.subtitle.placeholder')"
          md-inline
      ></form-element>

      <form-element
          type="form-file"
          name="image"
          :label="$t('fields.image')"
          style="flex: 1; min-width: 180px; max-width: 100%;"
          ref="image"
          gallery
          accept="image/png,image/jpeg,image/jpg,image/gif"
          :preview-max-width="600"
          :preview-max-height="1200">
      </form-element>

      <form-element
          type="md-editor"
          name="description"
          :label="$t('fields.description.label')"
          :placeholder="$t('fields.description.placeholder')"
          md-inline
      >
      </form-element>

      <form-element
        ref="userInput"
        type="user-input"
        :organization="organization"
        :permissions="permissions"
        name="parties"
        multiple
        :label="$t('fields.parties')"
        @change="onPartiesChanged"
      >
      </form-element>
      <slot></slot>
    </div>
</template>

<script>
  import UserInput from '../../common/UserInput';
  import FormElement from '../../../form/Element';
  import Firebase from '../../../../firebase';

  FormElement.components.UserInput = UserInput;

  export default {
    props: {
      type: String,
      organization: Object,
      permissions: Object
    },
    mounted() {
      this.form = this.$refs.userInput.form;
      this.form.$on('saved', this.onSaved);
    },
    beforeDestroy() {
      this.form.$off('saved', this.onSaved);
    },
    methods: {
      onPartiesChanged() {
        if (!this.hasOwnProperty('oldParties')) {
          this.oldParties = this.form.object.parties;
        }
      },
      onSaved(updates, ref) {
        if (updates.parties) {
          const prior = this.oldParties || [];
          const watchers = {};
          updates.parties.filter(uid => prior.indexOf(uid) < 0).forEach((uid) => {
            watchers[uid] = true;
          });
          if (Object.keys(watchers).length) {
            Firebase.database().ref(
              'watchers/organizations/' + this.organization.key + '/' + ref.key
            ).update(watchers);
          }
        }
        delete this.oldParties;
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource-detail-form {
    .form-element-title textarea {
      &, &::-webkit-input-placeholder {
        font-size: 24px;
      }
    }
    .form-element-subtitle textarea {
      color: rgba(0, 0, 0, 0.54);
    }

    .md-input-container > label {
      text-transform: capitalize;
    }

    .md-input-container.md-input-inline {
      label {
        opacity: 1;
        top: 0;
      }
    }
  }
</style>