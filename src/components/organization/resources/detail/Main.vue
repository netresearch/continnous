<template>
  <md-card class="resources-card-form">
    <md-card-content>
      <form-element
          type="md-textarea"
          md-inline name="title"
          :label="$t('fields.title')"
          :placeholder="$t(type + '.title')"
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
          :inline="!isNew"
          :get-url="File.getURL"
          :get-preview-url="File.getPreviewURL"
          :register-preview-url="File.registerPreviewURL"
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

      <form-element
          type="form-file"
          :label="$t('fields.attachments')"
          name="attachments"
          style="flex: 1; min-width: 180px;"
          ref="attachments"
          multiple
          :get-url="File.getURL">
      </form-element>
    </md-card-content>
  </md-card>
</template>

<script>
  import Config from '../../../../models/Config';
  import File from '../../../../models/File';

  const components = {};

  /* eslint-disable global-require, import/no-dynamic-require */
  Object.keys(Config.resources).forEach((resource) => {
    components[resource + '-form'] = require('./' + resource + '/Form');
  });

  export default {
    components,
    props: {
      type: String,
      isNew: Boolean
    },
    data() {
      return {
        File
      };
    },
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .resource {
    .form-element-title textarea {
      &, &::-webkit-input-placeholder {
        font-size: 24px;
      }
    }
    .form-element-subtitle textarea {
      color: rgba(0, 0, 0, 0.54);
    }
    .form-element-image {
      .md-input-container {
        margin-top: 10px;
      }
      &.form-element-has-value {
        .md-input-container {
          padding-top: 0;
          &:after {
            display: none;
          }
        }
        .md-input-container {
          margin: 0 0 10px;
        }
        label {
          display: none;
        }
      }
    }

    &.resource-create {
      .md-input-container.md-input-inline {
        label {
          opacity: 1;
          top: 0;
        }
      }
    }

    &.resource-edit {
      .md-input-container.md-input-inline {
        background: #fff;
        min-height: 0;
        margin: 0;
        padding: 0;
        label {
          display: none;
        }
        &:after {
          opacity: 0;
        }
        &:hover,
        &.md-input-focused {
          &:after {
            opacity: 1;
          }
        }
      }

      .md-input-container textarea {
        min-height: 0;
      }

      .form-element-disabled {
        .md-input-container {
          label, &:after, .form-file-info {
            display: none;
          }
          textarea, input {
            color: inherit;
          }
        }
      }
    }
  }
</style>