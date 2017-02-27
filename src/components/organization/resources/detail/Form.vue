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

      <component :is="type + '-form'"></component>

      <slot></slot>
    </div>
</template>

<script>
  import Config from '../../../../models/Config';

  const components = {};

  /* eslint-disable global-require, import/no-dynamic-require */
  Object.keys(Config.resources).forEach((resource) => {
    components[resource + '-form'] = require('./' + resource + '/Form');
  });

  export default {
    components,
    props: {
      type: String,
      edit: Boolean
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