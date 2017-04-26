// CommonJS because required on CLI

module.exports = class Mentions {
  static getMentions(string, scheme) {
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
  }

  static linkMentions(string, callback) {
    if (typeof string !== 'string') {
      return '';
    }
    let newString = string;
    const mentionTags = string.match(/<a[^>]+class="md-mention"[^>]+>/g);
    const uris = {};
    if (mentionTags) {
      mentionTags.forEach((match) => {
        const relMatch = /\s+rel="([^"])([^"]+)"/.exec(match);
        if (relMatch) {
          const k = relMatch[1] + relMatch[2];
          if (!uris.hasOwnProperty(k)) {
            uris[k] = callback(relMatch[1], relMatch[2]);
          }
          if (uris[k]) {
            newString = newString.replace(match, match.replace(relMatch[0], ' href="' + uris[k] + '"'));
          }
        }
      });
    }
    return newString;
  }
};
