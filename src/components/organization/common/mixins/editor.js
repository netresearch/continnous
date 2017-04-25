export default {
  methods: {
    getMentions(string, scheme) {
      if (scheme !== '@') {
        throw new Error('Currently only @ scheme supported');
      }
      if (typeof string !== 'string') {
        return [];
      }
      const mentions = [];
      const mentionTags = string.match(/<a[^>]+class="md-mention"[^>]+>/g);
      if (mentionTags) {
        mentionTags.forEach((match) => {
          const relMatch = /\s+rel="@([^"]+)"/.exec(match);
          if (relMatch) {
            const uid = relMatch[1];
            if (mentions.indexOf(uid) < 0) {
              mentions.push(uid);
            }
          }
        });
      }
      return mentions;
    },
    linkMentions(string, callback) {
      if (typeof string !== 'string') {
        return '';
      }
      let newString = string;
      const mentionTags = string.match(/<a[^>]+class="md-mention"[^>]+>/g);
      if (mentionTags) {
        mentionTags.forEach((match) => {
          const relMatch = /\s+rel="([^"])([^"]+)"/.exec(match);
          if (relMatch) {
            const uri = callback(relMatch[1], relMatch[2]);
            newString = newString.replace(match.replace(relMatch[0], ' href="' + uri + '"'));
          }
        });
      }
      return newString;
    }
  }
};
