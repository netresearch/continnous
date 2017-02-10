import Vue from 'vue';
import MutationObserver from 'mutation-observer';

export default new Vue({
  created() {
    /* global window, document */
    window.addEventListener('resize', () => {
      this.$emit('tick');
    });

    const observer = new MutationObserver(() => {
      this.$emit('tick');
    });

    observer.observe(
      document.body,
      { attributes: true, childList: true, characterData: true }
    );
  }
});
