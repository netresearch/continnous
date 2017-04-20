<template>
  <md-autocomplete
      ref="autocomplete"
      :provider="provider"
      :filter="filter"
      :min-length="minLength"
      :match-case="matchCase"
      input-selector="input.md-mentions-value"
      class="md-mentions-autocomplete"
      @selected="onSelected"
  >
    <template scope="autocomplete">
      <slot :value="autocomplete.value" :q="autocomplete.q">{{autocomplete.value}}</slot>
    </template>
    <template slot="input" scope="autocomplete">
      <input ref="input" :value="sword" type="text" class="md-mentions-value">
    </template>
  </md-autocomplete>
</template>

<script>
  /* global window */
  /* eslint-disable no-unused-vars */

  import Quill from 'quill';

  const Delta = Quill.import('delta');
  const Inline = Quill.import('blots/inline');

  // TODO: Re-implement this as an embed
  class MentionBlot extends Inline {
    static blotName = 'mention';
    static tagName = 'SPAN';
    static className = 'md-mention';

    static create(id) {
      const node = super.create();
      node.dataset.key = id[0];
      node.dataset.id = id.substr(1);
      return node;
    }

    static formats(node) {
      return {
        key: node.dataset.key,
        id: node.dataset.id,
        text: node.innerText
      };
    }

    formatAt(index, length, name, value) {
      this.format(name, value);
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

  function getRange() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return undefined;
  }

  function getPrecedingRange() {
    const r = getRange();
    if (r) {
      const range = r.cloneRange();
      range.collapse(true);
      range.setStart(range.endContainer, 0);
      return range;
    }
    return undefined;
  }

  export default {
    props: {
      providers: {
        type: Object,
        required: true
      },
      filter: Function,
      minLength: {
        type: Number,
        default: 1
      },
      matchCase: Boolean,
    },
    data() {
      return {
        focused: false,
        active: undefined,
        sword: ''
      };
    },
    mounted() {
      this.registerEditor = () => {
        const editorEl = this.$parent.$el.querySelector('[contenteditable]');
        const editor = this.$parent.editor;

        const addOrRemoveListeners = (add) => {
          let fn = (add === true ? 'add' : 'remove') + 'EventListener';
          ['Focus', 'Blur', 'KeyDown'].forEach((e) => {
            editorEl[fn](e.toLowerCase(), this['on' + e]);
          });
          window[fn]('resize', this.positionAutocomplete);

          this.$parent[add ? '$once' : '$off']('editor-destroyed', addOrRemoveListeners);

          fn = add === true ? 'on' : 'off';
          editor[fn]('text-change', this.onTextChange);
          editor[fn]('selection-change', this.onSelectionChange);

          if (add) {
            this.editor = editor;
            const bindings = this.editor.keyboard.bindings;
            this.editor.keyboard.addBinding({
              key: 13,
              format: ['mention']
            }, (keyboard, range, curContext) => console.log(keyboard, range, curContext));
            bindings[13].unshift(bindings[13].pop());
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
        const insert = ops[0].insert;
        const mention = (ops[0].attributes ? ops[0].attributes : this.editor.getFormat()).mention;
        if (mention) {
          this.sword = mention.key + mention.text;
          this.positionAutocomplete();
          if (!this.$refs.autocomplete.focused) {
            this.$refs.autocomplete.onFocus();
          }
          this.$nextTick(() => {
            this.$refs.autocomplete.onInput();
          });
        } else if (insert && this.providers.hasOwnProperty(insert)) {
          this.editor.deleteText(retain, 1);
          this.editor.format('mention', insert);
        } else {
          this.sword = '';
        }
        console.log(this.active, this.sword, insert);
      },
      onSelectionChange(range, oldRange, source) {
      },
      onFocus(e) {
        this.focused = true;
        console.log(e);
      },
      onBlur(e) {
        this.focused = false;
        console.log(e);
      },
      onKeyDown(e) {
        if (!this.editor.getFormat().mention) {
          return;
        }
        if (e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 13) {
          this.$refs.autocomplete.onKeyDown(e);
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      },
      onSelected(value, e) {
        e.propagate = false;
        console.log(this.editor.getFormat());
      },
      positionAutocomplete() {
        const selection = window.getSelection();
        const ac = this.$refs.autocomplete.$el;
        if (!selection) {
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

<style lang="scss" rel="stylesheet/scss">
  .md-mention {
    display: inline-block;
    white-space: nowrap;
    $r: 3px;
    border-radius: $r;
    background: rgba(#000, 0.06);
    border: 1px solid rgba(#000, 0.12);
    padding-right: $r;
    &:before {
      display:inline-block;
      content: attr(data-key);
      background: rgba(#000, 0.06);
      padding: 0 $r;
      margin-right: $r;
    }
  }
  .md-mentions-autocomplete {
    display: none;
    position: absolute !important;
  }
</style>