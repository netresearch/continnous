<template>
  <div class="form-file">
    <div class="file-list">
      <div v-for="file in files">
        {{file.name}}
        <md-image :md-src="file.preview"></md-image>
        <span v-if="file.error">ERROR</span>
      </div>
    </div>
    <div v-if="!files.length || multiple && (!limit || files.length < limit)" class="dropzone" ref="dropzone" @click="$refs.fileInput.click()">
      <md-icon>cloud_upload</md-icon>&nbsp;&nbsp;Drag and drop to upload or click here.
    </div>
    <input
      type="file"
      :disabled="disabled"
      :multiple="multiple"
      :accept="accept"
      ref="fileInput">
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
            const values = (typeof value === 'object') ? [value] : value;
            values.forEach((v) => {
              const existing = this.files.find(file => file.id === v.id && file.file);
              files.push(existing || this.createFileObject(v));
            });
          }
          this.files = files;
        }
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
      const input = this.$refs.fileInput;
      const dropzone = this.$refs.dropzone;

      // automatically submit the form on file select
      input.addEventListener('change', (e) => {
        this.acceptFiles(e.target.files);
      });

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
              this.resizeImage(file, this.previewMaxWidth, this.previewMaxHeight).then(
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
              values.push(this.createValueObject(fileRecord));
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
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
            canvas.width = width;
            canvas.height = height;
            context.drawImage(img, 0, 0, width, height);

            resolve({ url: canvas.toDataURL('image/png'), width: img.width, height: img.height });
          };

          reader.readAsDataURL(file);
        });
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
  .form-file {
    input[type="file"] {
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      position: absolute;
      clip: rect(0 0 0 0);
      border: 0;
    }
    .dropzone {
      cursor: pointer;
      border-radius: 2px;
      background: #eee;
      color: #969696;
      padding: 16px;
      transition: color 0.4s, box-shadow 0.4s;
      &:hover {
        color: inherit;
        box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12);
      }
      &.is-dragover {
        color: inherit;
        border: 2px dashed rgba(#000, 0.5);
        padding: 14px;
      }
    }
  }
</style>