<!-- This could be contributed to vue-material if the @save method would be extracted -->

<template>
  <form
      :class="['form-file-container', {'form-file-gallery': gallery && numFiles, 'form-file-inline': inline, 'form-file-has-files': numFiles > 0}]">
    <div class="form-file-list" v-if="numFiles">
      <div
          v-for="file in files"
          v-if="!file.deleted"
          :class="['form-file', {'form-file-with-preview': gallery && file.preview}]"
          :style="{maxWidth: gallery ? previewMaxWidth + 'px' : 'auto'}"
      >
        <div
            v-if="gallery && file.preview"
            class="form-file-preview"
            :style="{backgroundImage: 'url(' + file.preview + ')'}"
        >
        </div>
        <div v-if="gallery && !file.preview" class="form-file-icon">
          <md-icon>insert_drive_file</md-icon>
          <span>{{file.name ? file.name.split('.').pop() : ''}}</span>
        </div>
        <div class="form-file-info">
          <span class="form-file-extension">{{file.name ? file.name.split('.').pop() : ''}}</span>
          <span @click="download(file)" class="form-file-name md-primary" :title="$t('actions.downloadFile', {file: file.name})">{{file.name}}</span>
          <md-icon @click.native.stop="remove(file)":title="$t('actions.removeFile', {file: file.name})" class="form-file-clear" v-if="!disabled">clear</md-icon>
        </div>
      </div>
    </div>
    <div v-for="(files, type) in errors" class="form-file-error error">
      {{files.length > 1 ? files.slice(0, files.length - 1).join(', ') + ' ' + $t('and') + ' ' + files[files.length -1] : files[0]}}
      {{$tc('file.errors.notAdded', files.length)}}:
      {{$t('file.errors.' + type)}}.
    </div>
    <md-file
        type="file"
        :disabled="disabled"
        :multiple="multiple"
        :accept="accept"
        ref="mdFile"
        :class="{'form-file-input-hidden': box || disabled || numFiles && (!multiple || limit && numFiles >= limit)}"
        @selected="acceptFiles($event); $refs.mdFile.filename = undefined;"
        :placeholder="$t('file.placeholder')"></md-file>
    <div
        class="form-file-box"
        v-if="box && !disabled && (!numFiles || (multiple && (!limit || numFiles < limit)))"
        @click="$refs.mdFile.openPicker()"
    >
      <span>
        <md-icon>attach_file</md-icon>
        {{$t('file.placeholder')}}
      </span>
    </div>
  </form>
</template>

<script>
  export default {
    props: {
      value: [Array, Object],
      disabled: Boolean,
      required: Boolean,
      placeholder: String,
      accept: String,
      multiple: Boolean,
      limit: { type: Number, default: 10 },
      previewMaxWidth: { type: Number, default: 500 },
      previewMaxHeight: { type: Number, default: 500 },
      direct: Boolean,
      gallery: Boolean,
      getPreviewUrl: Function,
      registerPreviewUrl: Function,
      getUrl: Function,
      saveFile: Function,
      inline: Boolean,
      box: Boolean
    },
    data() {
      return {
        files: [],
        errors: undefined
      };
    },
    watch: {
      value: {
        deep: true,
        immediate: true,
        handler(value) {
          const files = [];
          if (value) {
            const values = this.multiple ? value : [value];
            values.forEach((v) => {
              const existing = this.files.find(file => file.id === v.id && file.file);
              files.push(existing || this.createFileObject(v));
            });
          }
          this.files = files;
        }
      }
    },
    computed: {
      numFiles() {
        let numFiles = 0;
        this.files.forEach((file) => {
          if (!file.deleted) {
            numFiles++;
          }
        });
        return numFiles;
      },
    },
    mounted() {
      this.addOrRemoveDragListeners('add');
    },
    beforeDestroy() {
      this.addOrRemoveDragListeners('remove');
    },
    methods: {
      addOrRemoveDragListeners(action) {
        if (!this.listeners) {
          this.listeners = {
            prevent: (e) => {
              e.preventDefault();
              e.stopPropagation();
            },
            over: () => {
              if (!this.multiple || !this.limit || this.numFiles < this.limit) {
                this.$el.classList.add('is-dragover');
              }
            },
            out: () => {
              this.$el.classList.remove('is-dragover');
            },
            drop: (e) => {
              this.acceptFiles(e.dataTransfer.files);
            },
            clearErrors: () => {
              this.errors = undefined;
            }
          };
        }
        const method = action + 'EventListener';
        ['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'].forEach((event) => {
          this.$el[method](event, this.listeners.prevent);
        });
        ['dragover', 'dragenter'].forEach((event) => {
          this.$el[method](event, this.listeners.over);
          this.$el[method](event, this.listeners.clearErrors);
        });
        ['dragleave', 'dragend', 'drop'].forEach((event) => {
          this.$el[method](event, this.listeners.out);
        });
        /* global document */
        document.body[method]('click', this.listeners.clearErrors);
        this.$el[method]('drop', this.listeners.drop);
      },
      download(file) {
        /* global FileReader, document */
        const download = (src) => {
          const link = document.createElement('a');
          link.download = file.name;
          link.href = src;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
        if (file.file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            download(e.target.result);
          };
          reader.readAsDataURL(file.file);
        } else if (this.getUrl) {
          this.getUrl(file, (src) => {
            download(src);
          });
        }
      },
      remove(file) {
        file.deleted = true;
        this.$el.reset();
        this.triggerChange();
      },
      acceptFiles(files) {
        const acceptedFiles = [];
        const accept = this.accept ? this.accept.split(',') : [];
        this.errors = {};
        const addError = (type, file) => {
          if (!this.errors[type]) {
            this.errors[type] = [];
          }
          this.errors[type].push(file.name);
        };
        for (let i = 0; i < files.length; i++) {
          let accepted = !accept.length;
          accept.forEach((mime) => {
            const requiredParts = mime.split('/');
            const givenParts = files[i].type.split('/');
            if (requiredParts[0] === givenParts[0]
              && (requiredParts[1] === '*' || requiredParts[1] === givenParts[1])) {
              accepted = true;
            }
          });
          if (accepted) {
            if (this.multiple) {
              if (!this.limit || this.numFiles + acceptedFiles.length < this.limit) {
                acceptedFiles.push(files[i]);
              } else {
                addError('limit', files[i]);
              }
            } else {
              this.files.forEach((file) => {
                file.deleted = true;
              });
              acceptedFiles.push(files[i]);
            }
          } else {
            addError('type', files[i]);
          }
        }
        acceptedFiles.forEach((file) => {
          const fileObject = this.createFileObject({
            name: file.name,
            id: this.generateUid()
          });
          this.files.push(fileObject);
          fileObject.file = file;
          if (file.type.substr(0, 6) === 'image/'
            && ['jpeg', 'jpg', 'png', 'gif'].indexOf(file.type.substr(6)) > -1) {
            this.resizeImage(file).then(
              (res) => {
                if (this.registerPreviewUrl) {
                  this.registerPreviewUrl(fileObject, res.url);
                }
                fileObject.preview = res.url;
                fileObject.width = res.width;
                fileObject.height = res.height;
                this.triggerChange();
              }
            );
          } else {
            this.triggerChange();
          }
        });
      },
      triggerChange() {
        const trigger = () => {
          let value = null;

          if (this.files.length) {
            const values = [];
            this.files.forEach((fileRecord) => {
              if (!fileRecord.deleted) {
                values.push(this.createValueObject(fileRecord));
              }
            });
            value = this.multiple ? values : (values[0] || null);
          }
          this.$emit('change', value);
          this.$emit('input', value);
        };
        if (this.direct) {
          this.save().then(trigger);
        } else {
          trigger();
        }
      },
      createFileObject(value) {
        const file = Object.assign({
          name: undefined,
          id: undefined,
          src: undefined,
          deleted: false,
          preview: undefined,
          progress: undefined,
          error: false,
          width: undefined,
          height: undefined
        }, value);
        if (!value.preview && this.gallery && this.getPreviewUrl) {
          this.getPreviewUrl(file, (src) => {
            file.preview = src;
          });
        }
        return file;
      },
      createValueObject(file) {
        const value = {
          name: file.name,
          id: file.id
        };
        if (file.width || file.height) {
          value.width = file.width;
          value.height = file.height;
        }
        return value;
      },
      save(saveFile) {
        const callback = saveFile || this.saveFile;
        const promises = [];
        this.files.forEach((file) => {
          if (file.deleted && file.file) {
            this.files = this.files.filter(f => f.id !== file.id);
          } else if (file.deleted || file.file) {
            const promise = new Promise((resolve, reject) => {
              const res = callback(file);
              if (res === undefined || res === true) {
                resolve();
              } else if (res === false || typeof res === 'string') {
                reject(res || true);
              } else if (typeof res === 'object' && typeof res.then === 'function') {
                res.then(resolve, reject);
              }
            });
            promise.then(
              () => {
                file.file = undefined;
                if (file.deleted) {
                  this.files = this.files.filter(f => f.id !== file.id);
                }
              },
              (error) => {
                file.error = error;
                file.deleted = false;
              }
            );
            promises.push(promise);
          }
          return file.deleted;
        });
        return Promise.all(promises);
      },
      resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve) => {
          /* global FileReader, document */
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = document.createElement('img');
            img.addEventListener('load', () => {
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');

              const scaled = this.scale(img, maxWidth, maxHeight);
              canvas.width = scaled.width;
              canvas.height = scaled.height;
              context.drawImage(img, 0, 0, scaled.width, scaled.height);

              resolve({ url: canvas.toDataURL('image/png'), width: img.width, height: img.height });
            });
            img.src = e.target.result;
          };

          reader.readAsDataURL(file);
        });
      },
      scale(img, maxWidth, maxHeight) {
        const max = {
          width: maxWidth || this.previewMaxWidth,
          height: maxHeight || this.previewMaxHeight
        };
        const newDims = { width: img.width, height: img.height };
        if (newDims.width && newDims.height) {
          if (newDims.width > newDims.height && newDims.width > max.width) {
            newDims.height *= max.width / newDims.width;
            newDims.width = max.width;
          }
          if (newDims.height > max.height) {
            newDims.width *= max.height / newDims.height;
            newDims.height = max.height;
          }
        }
        return newDims;
      },
      generateUid() {
        const s4 = () => Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
          s4() + '-' + s4() + s4() + s4();
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .md-input-container .form-file-container {
    flex: 1;
  }
  .form-file-input-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    margin: -1px;
    padding: 0;
    clip: rect(0 0 0 0);
  }
  .form-file-container {
    max-width: 100%;
    .md-icon:after {
      display: none;
    }
    position: relative;
    &.is-dragover {
      margin: 2px -2px -2px;
      border: 2px dashed rgba(#000, 0.5);
      &.form-file-gallery {
        margin-top: 8px;
        .form-file-list {
          margin-top: -6px;
        }
      }
      .md-file {
        padding-left: 6px;
        .md-icon {
          position: relative;
        }
      }
    }
    .form-file-error {
      margin-bottom: 6px;
    }
    .form-file-list {
      margin: 4px -5px 0;
    }
    &.form-file-gallery .form-file-list {
      display: flex;
      flex-flow: row wrap;
    }
    &.form-file-gallery.form-file-inline {
      .form-file {
        position: relative;
        .form-file-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(#fff, 0.8);
          padding-left: 12px;
          padding-right: 8px;
          opacity: 0;
          transition: opacity 0.5s;
        }
        &:hover .form-file-info {
          opacity: 1;
        }
      }
    }
    .form-file {
      &.form-file-with-preview {
        padding: 0 5px;
      }
      flex: 1;
      min-width: 150px;
      .form-file-icon,
      .form-file-preview {
        margin-top: 6px;
        position: relative;
        background: #eeeeee;
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center;
        &:before {
          content: "";
          display: block;
          padding-top: 56.25%;
        }
      }
      .form-file-preview {
        box-sizing: content-box;
        border: 16px solid #eeeeee;
      }
      .form-file-icon {
        cursor: default;
        .md-icon, span {
          position: absolute;
          top: 50%;
          left: 50%;
        }
        .md-icon {
          font-size: 68px;
          width: 68px;
          height: 68px;
          margin-left: -34px;
          margin-top: -34px;
          &:after {
            display: none;
          }
        }
        span {
          display: block;
          color: #eee;
          text-transform: uppercase;
          font-size: 12px;
          width: 36px;
          margin-left: -18px;
          margin-top: 12px;
          line-height: 12px;
        }
      }
      .form-file-info {
        width: 100%;
        padding: 6px;
        display: flex;
        flex-flow: row wrap;
        cursor: default;
        .form-file-name {
          display: inline-block;
          flex: 1;
          margin: 0 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          position: relative;
          cursor: pointer;
          &:hover {
            text-decoration: underline;
          }
        }
        .form-file-extension {
          margin-top: 1px;
          font-size: 8px;
          line-height: 18px;
          border-radius: 1px;
          text-transform: uppercase;
          display: inline-block;
          height: 18px;
          color: #fff;
          background: rgba(#000, 0.4);
          width: 24px;
          text-align: center;
          overflow: hidden;
        }
        .md-icon {
          position: relative;
          margin-bottom: 0;
          cursor: pointer;
          margin-top: -2px;
          &:hover {
            color: #000;
          }
          &.form-file-download {
            top: 1px;
          }
        }
      }
    }
    .form-file-box {
      cursor: pointer;
      text-align: center;
      padding: 8px;
      border: 1px dashed rgba(#000, 0.1);
      color: rgba(#000, 0.56);
      span {
        display: inline-flex;
        flex-flow: row;
        align-items: center;
        text-align: left;
        .md-icon {
          margin-left: 0;
          margin-right: 8px;
        }
      }
    }
    &.form-file-has-files .form-file-box {
      margin-top: 2px;
    }
  }
</style>