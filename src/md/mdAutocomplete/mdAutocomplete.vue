<style lang="scss" src="./mdAutocomplete.scss"></style>

<template>
  <div class="md-autocomplete">
    <div ref="content" class="md-autocomplete-content">
      <slot name="input" :q="q" :currentResults="currentResults" :results="results"></slot>
    </div>
    <md-progress md-indeterminate v-if="loading"></md-progress>
    <div class="md-autocomplete-flyout" :class="above ? 'md-autocomplete-above' : ''" ref="flyout">
      <div class="md-autocomplete-flyout-inner md-whiteframe md-whiteframe-1dp" v-show="q && currentResults || forceFlyout">
        <md-list class="md-autocomplete-results" v-if="currentResults && currentResults.length">
          <md-list-item
              v-for="(value, i) in currentResults"
              :class="currentKey === i ? 'md-autocomplete-selected' : ''"
              @click.native="select(i)">
            <slot :value="value" :q="q">{{value}}</slot>
          </md-list-item>
        </md-list>
        <slot name="flyout" v-if="q || forceFlyout" :currentResults="currentResults" :results="results" :q="q"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import MutationObserver from 'mutation-observer';

/* global window, document */

export default {
  props: {
    provider: {
      type: Function,
      required: true
    },
    filter: Function,
    minLength: {
      type: Number,
      default: 1
    },
    matchCase: Boolean,
    inputSelector: {
      type: String,
      default: 'input'
    },
    forceFlyout: Boolean
  },
  data() {
    return {
      loading: 0,
      // Current input value
      q: undefined,
      // Current results (for q)
      currentResults: undefined,
      // Results by input value (keys = q, values = currentResults)
      results: {},
      previousValue: undefined,
      above: false,
      focused: false,
      currentKey: undefined,
    };
  },
  mounted() {
    const registerInput = () => {
      const input = this.$el.querySelector(this.inputSelector);
      if (!input) {
        /* eslint-disable no-console */
        console.warn('MD-AUTOCOMPLETE WARNING: Could not find input element');
        /* eslint-enable no-console */
        return;
      }
      if (input === this.input) {
        return;
      }

      this.input = input;
      this.input.addEventListener('input', this.onInput);
      this.input.addEventListener('focus', this.show);
      this.input.addEventListener('blur', this.onBlur);
      this.input.addEventListener('keydown', this.onKeyDown);
      this.unregisterInput = () => {
        if (this.input) {
          this.input.removeEventListener('input', this.onInput);
          this.input.removeEventListener('focus', this.show);
          this.input.removeEventListener('blur', this.onBlur);
          this.input.removeEventListener('keydown', this.onKeyDown);
          this.input = undefined;
          this.q = undefined;
          this.currentResults = undefined;
        }
      };
    };

    registerInput();

    this.contentObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        for (let i = 0; i < mutation.removedNodes.length; ++i) {
          if (mutation.removedNodes[i] === this.input) {
            this.unregisterInput();
            break;
          }
        }
      });
      this.$nextTick(registerInput);
    });
    this.contentObserver.observe(this.$refs.content, {
      subtree: true,
      childList: true
    });
    this.flyout = this.$refs.flyout;
    this.flyout.parentNode.removeChild(this.flyout);
    this.flyoutObserver = new MutationObserver((mutations) => {
      let reposition = false;
      mutations.forEach((mutation) => {
        if (mutation.type !== 'attributes' || mutation.target !== this.flyout) {
          reposition = true;
        }
      });
      if (reposition) {
        this.positionFlyout();
      }
    });
    this.flyoutObserver.observe(this.flyout, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true
    });

    let container = this.$el.parentNode;
    let overflowY;
    while (container !== document.body) {
      overflowY = window.getComputedStyle(container).getPropertyValue('overflow-y');
      if (overflowY === 'auto' || overflowY === 'hidden') {
        break;
      }
      container = container.parentNode;
    }
    this.container = container;
    this.container.addEventListener('scroll', this.positionFlyout);

    window.addEventListener('resize', this.positionFlyout);
  },
  beforeDestroy() {
    this.contentObserver.disconnect();
    this.flyoutObserver.disconnect();
    this.unregisterInput();
    this.container.removeEventListener('scroll', this.positionFlyout);
    window.removeEventListener('resize', this.positionFlyout);
    if (document.body.contains(this.flyout)) {
      document.body.removeChild(this.flyout);
    }
  },
  methods: {
    show() {
      this.focused = true;
      document.body.appendChild(this.flyout);
      this.onInput();
      this.positionFlyout();
      window.setTimeout(this.positionFlyout, 200);
    },
    hide() {
      this.focused = false;
      this.currentKey = undefined;
      this.$el.appendChild(this.flyout);
    },
    onBlur(e) {
      if (e.relatedTarget && this.flyout && this.flyout.contains(e.relatedTarget)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (['input', 'textarea', 'select'].indexOf(e.relatedTarget.tagName.toLowerCase()) > -1) {
          e.relatedTarget.focus();
        } else {
          window.setTimeout(() => this.input.focus(), 100);
        }
        return;
      }
      this.focused = false;
      window.setTimeout(this.blur, 100);
    },
    blur() {
      if (this.focused && this.input) {
        this.input.blur();
        return;
      }
      this.hide();
    },
    onInput() {
      let q = this.input.value.trim();
      if (!this.matchCase) {
        q = q.toLowerCase();
      }
      this.q = q;
      if (q.length < this.minLength) {
        this.previousValue = undefined;
        this.currentKey = undefined;
        this.currentResults = undefined;
        return;
      }
      if (q === this.previousValue) {
        return;
      }
      if (this.results[q]) {
        this.setCurrentResults(this.results[q]);
        return;
      }
      this.previousValue = q;
      const results = this.provider(q);
      if (typeof results === 'object' && typeof results.then === 'function') {
        this.loading++;
        results.then((r) => {
          this.loading--;
          this.results[q] = r;
          if (q === this.q) {
            this.setCurrentResults(r);
          }
        });
      } else {
        this.setCurrentResults(results);
      }
    },
    onKeyDown(e) {
      // 40 == ArrowDown, 38 == ArrowUp, 13 = Enter
      const code = e.keyCode;
      if ([40, 38].indexOf(code) > -1 && this.cursor(code) !== false) {
        e.preventDefault();
      } else if (code === 13 && this.select() !== false) {
        e.preventDefault();
      }
    },
    cursor(direction) {
      if (!this.currentResults || !this.currentResults.length) {
        return false;
      }
      let d = direction || 1;
      if (d === 40) {
        d = 1;
      } else if (d === 38) {
        d = -1;
      } else if (d !== 1 || d !== -1) {
        return false;
      }
      d *= (this.above ? -1 : 1);
      const current = this.currentKey === undefined ? -1 : this.currentKey;
      let next = current + d;
      if (next >= this.currentResults.length) {
        next = 0;
      } else if (next < 0) {
        next = this.currentResults.length - 1;
      }
      this.currentKey = next;
      return next;
    },
    select(key) {
      if (!this.currentResults || !this.currentResults.length) {
        return false;
      }
      const select = key !== undefined ? key : this.currentKey;
      if (select === undefined || this.currentResults[select] === undefined) {
        return false;
      }
      const value = this.currentResults[select];
      this.currentKey = undefined;
      this.blur();
      const event = {
        q: this.q,
        currentResults: this.currentResults,
        results: this.results,
        input: this.input,
        propagate: true
      };
      this.$emit('selected', value, event);
      if (event.propagate && this.input) {
        this.input.value = value;
      }
      return select;
    },
    setCurrentResults(results) {
      if (!Array.isArray(results)) {
        /* eslint-disable no-console */
        console.warn('MD-AUTOCOMPLETE WARNING: results must be array - refused taking over');
        /* eslint-enable no-console */
      }
      this.currentKey = undefined;
      this.currentResults = this.filter ? results.filter(this.filter) : results;
    },
    updateCurrentResults() {
      if (this.q && this.results[this.q]) {
        this.setCurrentResults(this.results[this.q]);
      }
    },
    clearCache() {
      this.results = {};
      if (this.focused) {
        this.onInput();
      }
    },
    positionFlyout() {
      if (!this.input || !this.flyout) {
        return;
      }
      const style = this.flyout.style;

      const c = this.container.getBoundingClientRect();
      const i = this.input.getBoundingClientRect();
      const p = this.input.parentNode.getBoundingClientRect();
      const f = this.flyout.children[0].getBoundingClientRect();

      const cTop = c.top - window.scrollY;
      const cHeight = c.height;
      const iTop = i.top - window.scrollY;
      const iHeight = i.height;
      const pTop = p.top - window.scrollY;
      const pHeight = p.height;
      const pBottom = window.innerHeight - pTop - pHeight;
      const padding = 4;
      const fHeight = f.height + (2 * padding);

      let above;
      if (iTop > cTop + cHeight || iTop + iHeight < cTop) {
        style.opacity = 0;
        style.zIndex = -1;
        return;
      }
      if (pTop + pHeight > cTop + cHeight) {
        above = true;
      } else if (pTop < cTop) {
        above = false;
      } else {
        above = fHeight >= pBottom && pTop >= fHeight;
      }
      this.above = above;
      this.flyout.setAttribute(
        'style',
          'top: ' + (above ? p.top - fHeight + padding : p.top + pHeight - padding) + 'px; '
        + 'left: ' + (p.left - padding) + 'px; '
        + 'min-width: ' + (p.width + 2 * padding) + 'px;'
        + 'max-height: ' + (Math.max(1, above ? pTop : pBottom) - padding) + 'px'
      );
    }
  }
};
</script>