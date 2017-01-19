<template>
  <div class="form-file-container">
    <div class="form-file-list" v-if="numFiles">
      <div v-for="file in files" v-if="!file.deleted" class="form-file">
        <div
            v-if="accept && accept.substr(0, 6) === 'image/' && file.preview"
            class="form-file-preview"
            :style="{backgroundImage: 'url(' + file.preview + ')'}"
        >
        </div>
        <div class="form-file-info">
          <span class="form-file-extension">{{file.name ? file.name.split('.').pop() : ''}}</span>
          <span class="form-file-name" :title="file.name">{{file.name}}</span>
          <md-icon @click.native="remove(file)">clear</md-icon>
        </div>
      </div>
    </div>
    <md-file
      type="file"
      :disabled="disabled"
      :multiple="multiple"
      :accept="accept"
      ref="mdFile"
      v-show="!numFiles || (multiple && (!limit || numFiles < limit))"
      @selected="acceptFiles($event); $refs.mdFile.filename = undefined;"
      :placeholder="$t('file.placeholder')"></md-file>
  </div>
</template>

<script>
  import Child from './child';
  import Firebase from '../../firebase';

  export default {
    extends: Child,
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
      direct: Boolean
    },
    data() {
      return {
        files: []
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
      }
    },
    created() {
      this.progress = undefined;

      this.$on('registered', (form) => {
        form.$on('before-save', (beforeSave, progress) => {
          beforeSave.push(this.save(progress));
        });
      });
    },
    mounted() {
      const dropzone = this.$refs.mdFile.$el;

      ['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'].forEach((event) => {
        dropzone.addEventListener(event, (e) => {
          // preventing the unwanted behaviours
          e.preventDefault();
          e.stopPropagation();
        });
      });

      ['dragover', 'dragenter'].forEach((event) => {
        dropzone.addEventListener(event, () => {
          dropzone.classList.add('is-dragover');
        });
      });
      ['dragleave', 'dragend', 'drop'].forEach((event) => {
        dropzone.addEventListener(event, () => {
          dropzone.classList.remove('is-dragover');
        });
      });
      dropzone.addEventListener('drop', (e) => {
        this.acceptFiles(e.dataTransfer.files);
      });
    },
    methods: {
      remove(file) {
        file.deleted = true;
        this.triggerChange();
      },
      acceptFiles(files) {
        for (let i = 0; i < files.length; i++) {
          ((file) => {
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
                  fileObject.preview = res.url;
                  fileObject.width = res.width;
                  fileObject.height = res.height;
                  this.triggerChange();
                }
              );
            } else if (this.direct) {
              this.triggerChange();
            }
          })(files[i]);
        }
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
            value = this.multiple ? values : values[0];
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
        return Object.assign({
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
      save(progress) {
        const ref = Firebase.storage().ref();
        const promises = [];
        this.files = this.files.filter((file) => {
          if (file.deleted) {
            if (!file.file) {
              const children = [file.id];
              if (file.preview) {
                children.push(file.id + '_preview');
              }
              children.forEach((child) => {
                promises.push(new Promise((resolve, reject) => {
                  ref.child(child).delete().then(resolve).catch(reject);
                }));
              });
            }
            return false;
          } else if (file.file) {
            let totalBytes = 0;
            const monitorUpload = (task) => {
              promises.push(new Promise((resolve, reject) => {
                let totalBytesAdded = false;
                const fileProgress = progress ? progress.get() : null;
                task.on('state_changed', (snapshot) => {
                  if (!totalBytesAdded) {
                    totalBytesAdded = true;
                    totalBytes += snapshot.totalBytes;
                    if (fileProgress) {
                      fileProgress.setTotal(snapshot.totalBytes);
                    }
                  }
                  file.progress = (snapshot.bytesTransferred / totalBytes) * 100;
                  if (fileProgress) {
                    fileProgress.tick(snapshot.bytesTransferred);
                  }
                }, (error) => {
                  file.error = error;
                  reject(error);
                }, resolve);
              }));
            };
            monitorUpload(ref.child(file.id).put(file.file));
            if (file.preview) {
              monitorUpload(ref.child(file.id + '_preview').putString(
                file.preview.split(',').pop(), 'base64', {
                  contentType: 'image/png',
                }
              ));
            }
          }
          return true;
        });
        return Promise.all(promises);
      },
      resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve) => {
          /* global FileReader, document */
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            const scaled = this.scale(img, maxWidth, maxHeight);
            canvas.width = scaled.width;
            canvas.height = scaled.height;
            context.drawImage(img, 0, 0, scaled.width, scaled.height);

            resolve({ url: canvas.toDataURL('image/png'), width: img.width, height: img.height });
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
    padding-top: 4px;
    flex: 1;
  }
  .form-file-container {
    .md-file {
      &.is-dragover {
        color: inherit;
        border: 2px dashed rgba(#000, 0.5);
        background: #fff;
        overflow: hidden;
        padding-left: 6px;
        .md-icon {
          position: relative;
        }
      }
    }
    .form-file-list {
      display: flex;
      flex-flow: row wrap;
      margin: 0 -5px;
    }
    .form-file {
      padding: 0 5px;
      flex: 1;
      min-width: 150px;
      max-width: 250px;
      .form-file-info {
        padding: 6px;
        display: flex;
        flex-flow: row wrap;
        .form-file-name {
          flex: 1;
          margin: 0 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .form-file-extension {
          margin-top: 1px;
          font-size: 9px;
          line-height: 18px;
          border-radius: 1px;
          text-transform: uppercase;
          display: inline-block;
          height: 18px;
          color: #fff;
          background: #bbb;
          width: 28px;
          text-align: center;
          overflow: hidden;
        }
        .md-icon {
          position: relative;
          margin-top: -2px;
          margin-bottom: 0;
          cursor: pointer;
          &:hover {
            color: #000;
          }
        }
      }
      .form-file-preview {
        margin-top: 6px;
        max-width: 100%;
        position: relative;
        background: #eeeeee;
        background-repeat: no-repeat;
        background-size: cover;
        background-position: center;
        &:before {
          content: "";
          display: block;
          padding-top: 56.25%;
        }
        img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      }
    }
  }
</style>