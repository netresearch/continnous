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
          type="md-textarea"
          name="description"
          :label="$t('fields.description.label')"
          :placeholder="$t('fields.description.placeholder')"
          md-inline
      >
      </form-element>
      <slot></slot>
    </div>
</template>

<script>
  export default {
    props: {
      type: String
    },
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