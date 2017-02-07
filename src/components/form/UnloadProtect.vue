<template>
  <div style="display: none">
    <md-dialog
        ref="dialog"
        :md-click-outside-to-close="false"
        :md-esc-to-close="false"
        v-if="open !== undefined">
      <md-dialog-content>{{$t('unload.text')}}</md-dialog-content>
      <md-dialog-actions>
        <md-button v-if="canSave" class="md-primary md-raised" @click="save()">{{$t('unload.save')}}</md-button>
        <md-button class="md-primary" @click="close(true)">{{$t('unload.continue')}}</md-button>
        <span style="flex: 1"></span>
        <md-button @click="close()">{{$t('actions.abort')}}</md-button>
      </md-dialog-actions>
      <md-message :status="status" :progress="progress"></md-message>
    </md-dialog>
  </div>
</template>

<script>
  import Child from './child';

  let forms = [];
  const continueRoute = (proceed) => {
    if (continueRoute.next) {
      continueRoute.next(proceed ? undefined : false);
      delete continueRoute.next;
    }
  };
  let beforeEachAdded = false;
  const beforeEach = (to, from, next) => {
    if (forms.length) {
      const saving = forms.find(form => form.status === 0);
      continueRoute.next = next;
      if (!saving) {
        const unsaved = forms.find(form => form.hasChanged(true));
        if (unsaved) {
          // Show dialog
          forms[0].protector.canSave = forms.find(form => form.hasChanged());
          forms[0].protector.open = true;
        } else {
          // Continue
          continueRoute(true);
        }
      }
    } else {
      delete continueRoute.next;
      next();
    }
  };

  export default {
    extends: Child,
    data() {
      return {
        status: undefined,
        progress: false,
        next: undefined,
        canSave: undefined,
        mounted: false,
        open: undefined
      };
    },
    created() {
      if (this.$router && !beforeEachAdded) {
        beforeEachAdded = true;
        this.$router.beforeEach(beforeEach);
      }
    },
    watch: {
      open(open) {
        if (!open) {
          if (this.$refs.dialog) {
            this.$refs.dialog.close();
          }
        } else {
          this.$nextTick(() => {
            this.$nextTick(() => {
              this.$refs.dialog.open();
            });
          });
        }
      }
    },
    mounted() {
      /* global window */
      window.onbeforeunload = () => {
        const unsaved = forms.find(form => form.hasChanged(true));
        return unsaved ? this.$t('unload.confirm') : undefined;
      };
      forms.push(this.form);
      this.form.protector = this;

      this.form.$on('before-save', this.updateStatus);
      this.form.$on('saved', this.updateStatus);
      this.form.$on('save-error', this.updateStatus);
      this.form.$on('progress', this.updateProgress);
    },
    beforeDestroy() {
      /* global window */
      window.onbeforeunload = null;
      forms = forms.filter(form => form !== this.form);
      delete this.form.protector;
      this.form.$off('before-save', this.updateStatus);
      this.form.$off('saved', this.updateStatus);
      this.form.$off('save-error', this.updateStatus);
      this.form.$on('progress', this.updateProgress);
    },
    methods: {
      save() {
        this.doSave = true;
        forms.map(form => form.save());
      },
      close(proceed) {
        this.open = false;
        this.$nextTick(() => {
          continueRoute(proceed);
        });
      },
      updateStatus() {
        const saving = forms.find(form => form.status === 0);
        if (saving) {
          this.status = 0;
        } else {
          const error = forms.find(form => form.status === -1);
          if (error) {
            this.status = -1;
            this.canSave = false;
          } else {
            this.status = 1;
            /* global window */
            window.setTimeout(this.close.bind(this, true), 1000);
          }
        }
      },
      updateProgress(progress) {
        this.progress = progress;
      }
    }
  };
</script>