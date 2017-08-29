<template>
  <md-autocomplete
      ref="autocomplete"
      :provider="provider"
      :min-length="minLength + 1"
      :match-case="matchCase"
      :force-flyout="!!current"
      input-selector="input.md-mentions-value"
      class="md-mentions-autocomplete"
      @selected="onSelected"
  >
    <template scope="autocomplete">
      <slot :value="autocomplete.value" :k="autocomplete.q[0]" :q="autocomplete.q.substr(1)">
        {{normalize[autocomplete.q[0]](autocomplete.value).text}}
      </slot>
    </template>
    <template slot="input" scope="autocomplete">
      <input ref="input" :value="sword" type="text" class="md-mentions-value">
    </template>
    <template slot="flyout" scope="autocomplete">
      <div v-if="current" class="md-autocomplete-flyout-item md-primary">
        <slot name="current" :k="current.key" :id="current.id" :text="current.text">
          {{current.text}}
        </slot>
        <md-button class="md-icon-button" @click.native.prevent.stop="removeMention">
          <md-icon>clear</md-icon>
        </md-button>
      </div>
      <slot
          name="flyout"
          v-if="autocomplete.q && autocomplete.currentResults"
          :currentResults="autocomplete.currentResults"
          :results="autocomplete.results"
          :q="autocomplete.q.substr(1)"
          :k="autocomplete.q[0]"
          :current="current"></slot>
    </template>
  </md-autocomplete>
</template>

<script>
  /* global window */
  /* eslint-disable no-unused-vars */

  import Quill from 'quill';

  const Delta = Quill.import('delta');
  const Inline = Quill.import('blots/inline');

  class MentionBlot extends Inline {
    static blotName = 'mention';
    static tagName = 'A';
    static className = 'md-mention';

    static create(mention) {
      const node = super.create();
      MentionBlot.format(node, mention);
      return node;
    }

    static format(node, mention) {
      node.setAttribute('rel', mention.key + (mention.id || ''));
      ['focused', 'current'].forEach((key) => {
        if (mention[key]) {
          node.dataset[key] = true;
        } else {
          delete node.dataset[key];
        }
      });
      if (mention.focused) {
        node.dataset.key = mention.key;
      } else {
        delete node.dataset.key;
      }
    }

    static formats(node) {
      const rel = node.getAttribute('rel') || '';
      return {
        key: rel[0],
        id: rel.substr(1),
        text: node.innerText,
        focused: node.dataset.focused || false,
        current: node.dataset.current || false
      };
    }

    format(name, value) {
      if (name === 'mention' && value) {
        MentionBlot.format(this.domNode, value);
      } else {
        super.format(name, value);
      }
    }

    formatAt(index, length, name, value) {
      if (name === 'mention') {
        super.formatAt(index, length, name, value);
      }
    }

    formats() {
      const formats = super.formats();
      formats.mention = MentionBlot.formats(this.domNode);
      return formats;
    }
  }

  Quill.register({
    'formats/mention': MentionBlot
  });

  export default {
    props: {
      providers: {
        type: Object,
        required: true
      },
      normalize: {
        type: Object,
        required: true
      },
      minLength: {
        type: Number,
        default: 1
      },
      matchCase: Boolean,
      ignoreAfter: {
        type: RegExp,
        default() {
          return /[a-z]/i;
        }
      }
    },
    data() {
      return {
        sword: '',
        current: undefined
      };
    },
    mounted() {
      this.registerEditor = () => {
        const editor = this.$parent.editor;

        const addOrRemoveListeners = (add) => {
          let fn = (add === true ? 'add' : 'remove') + 'EventListener';
          window[fn]('resize', this.positionAutocomplete);

          this.$parent[add ? '$once' : '$off']('editor-destroyed', addOrRemoveListeners);

          fn = add === true ? 'on' : 'off';
          editor[fn]('text-change', this.onTextChange);
          editor[fn]('selection-change', this.onSelectionChange);

          if (add) {
            this.editor = editor;
            const bindings = this.editor.keyboard.bindings;
            const keys = [13, 27, 37, 38, 39, 40];
            const format = ['mention'];
            keys.forEach((key) => {
              this.editor.keyboard.addBinding({ key, format }, this.onKeyDown.bind(this, key));
              bindings[key].unshift(bindings[key].pop());
            });
          } else {
            delete this.editor;
          }
        };
        addOrRemoveListeners(true);

        this.unregisterEditor = () => {
          addOrRemoveListeners(false);
          this.$parent.$off('editor-mounted', this.registerEditor);
        };
      };
      if (this.$parent.editor) {
        this.registerEditor();
      }
      this.$parent.$on('editor-mounted', this.registerEditor);
    },
    beforeDestroy() {
      if (this.unregisterEditor) {
        this.unregisterEditor();
      }
    },
    methods: {
      provider(q) {
        return this.providers[q[0]](q.substr(1));
      },
      onTextChange(delta, oldDelta, source) {
        if (source !== 'user') {
          return;
        }
        const ops = delta.ops.slice(0);
        const retain = ops[0].hasOwnProperty('retain') ? ops.shift().retain : 0;
        if (!ops.length || this.editor.getFormat()['code-block']) {
          return;
        }
        const insert = ops[0].insert;
        const mention = (ops[0].attributes ? ops[0].attributes : this.editor.getFormat()).mention;
        if (mention && !mention.id) {
          this.sword = mention.key + mention.text;
          this.showAutocomplete();
        } else if (insert && this.providers.hasOwnProperty(insert)) {
          if (!retain || !this.ignoreAfter.test(this.editor.getText(retain - 1, 1))) {
            this.editor.insertText(retain, '\uFEFF', 'mention', { key: insert, focused: true });
            window.setTimeout(() => {
              this.editor.deleteText(retain + 1, 1);
            });
            if (!retain) {
              this.editor.root.classList.remove('ql-blank');
            }
          }
        } else {
          this.sword = '';
        }
      },
      onSelectionChange(range, oldRange, source) {
        if (!range) {
          this.blurMention();
        } else if (range.length) {
          const mention = this.editor.getFormat(range).mention;
          const oldMention = oldRange ? this.editor.getFormat(oldRange).mention : undefined;
          if (mention ? !oldMention : oldMention) {
            this.blurMention();
          }
        } else if (source === 'user') {
          const mention = this.editor.getFormat(range.index).mention;
          if (mention && !mention.focused && !mention.current) {
            if (oldRange) {
              const oldMention = this.editor.getFormat(oldRange).mention;
              if (oldMention && (oldMention.focused || oldMention.current)) {
                this.blurMention();
              }
            }
            let length = 0;
            let index = range.index;
            while (index - 1 > -1 && this.editor.getFormat(index).mention) {
              index--;
              length++;
            }
            while (this.editor.getFormat(index + length + 1).mention) {
              length++;
            }
            this.editor.formatText(index, length, 'mention', Object.assign({}, mention, {
              current: true
            }), 'silent');
            this.current = mention;
            this.showAutocomplete();
          } else if (!mention) {
            this.blurMention();
          }
        }
      },
      onKeyDown(key, range, curContext) {
        const autocomplete = this.$refs.autocomplete;
        if (key === 38 || key === 40) {
          if (autocomplete.cursor(key) === false) {
            this.blurMention();
          } else {
            return false;
          }
        }
        if (key === 13) {
          autocomplete.select();
          return false;
        }
        if (key === 37 && !curContext.prefix.trim() || key === 39 && !curContext.suffix) {
          this.blurMention();
          if (key === 39 || key === 27) {
            this.editor.setSelection(range.index + 1);
          }
          return key !== 27;
        }
        return true;
      },
      getMention() {
        const node = this.editor.root.querySelector(
          '.md-mention[data-focused], .md-mention[data-current]'
        );
        if (!node) {
          return undefined;
        }
        const blot = Quill.find(node);
        if (!blot) {
          return undefined;
        }
        const attributes = MentionBlot.formats(node);
        const index = this.editor.getIndex(blot);
        const length = blot.length();
        return { blot, attributes, index, length };
      },
      blurMention() {
        const mention = this.getMention();
        if (mention) {
          const { attributes, index, length } = mention;
          if (attributes.id) {
            delete attributes.focused;
            delete attributes.current;
            this.editor.formatText(index, length, 'mention', attributes);
          } else {
            this.editor.removeFormat(index, length);
            this.editor.insertText(index, attributes.key);
            this.editor.deleteText(index + 1, 1);
          }
        }
        this.hideAutocomplete();
      },
      removeMention() {
        const mention = this.getMention();
        if (mention) {
          const { index, length } = mention;
          this.editor.removeFormat(index, length, 'user');
        }
        this.hideAutocomplete();
      },
      onSelected(value, e) {
        e.propagate = false;
        const mention = this.getMention();
        if (mention) {
          const { attributes, index, length } = mention;
          const normalized = this.normalize[attributes.key](value);
          const ops = [
            { delete: length },
            {
              insert: normalized.text,
              attributes: {
                mention: { key: attributes.key, id: normalized.id }
              }
            },
            { insert: ' ' }
          ];
          if (index > 0) {
            ops.unshift({ retain: index });
          }
          this.editor.updateContents({ ops }, 'user');
          this.editor.setSelection(index + normalized.text.length + 1);
        }
        this.hideAutocomplete();
      },
      hideAutocomplete() {
        this.sword = '';
        this.current = undefined;
        this.$refs.autocomplete.hide();
        this.$refs.autocomplete.$el.removeAttribute('style');
      },
      showAutocomplete() {
        this.positionAutocomplete();
        this.$nextTick(() => {
          this.$refs.autocomplete.show();
        });
      },
      positionAutocomplete() {
        const selection = window.getSelection();
        const ac = this.$refs.autocomplete.$el;
        if (!selection || !selection.anchorNode) {
          ac.removeAttribute('style');
          return;
        }
        const mention = selection.anchorNode.parentNode;
        if (!mention || !mention.classList.contains('md-mention')) {
          ac.removeAttribute('style');
          return;
        }
        const p = this.$parent.$el.getBoundingClientRect();
        const m = mention.getBoundingClientRect();
        this.$refs.input.style.height = m.height + 'px';
        ac.setAttribute(
          'style',
          'display: block; ' +
          'top: ' + (m.top - p.top) + 'px; ' +
          'left: ' + (m.left - p.left) + 'px'
        );
      }
    }
  };
</script>