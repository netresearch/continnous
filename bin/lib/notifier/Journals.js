const AbstractNotifier = require('./Abstract');
const html2text = require('html-to-text');
const Config = require('../../../src/models/Config');
const Mentions = require('../../../src/models/Mentions');

/**
 * Send emails to item watchers on new journal entries
 *
 * @type {JournalsNotifier}
 */
module.exports = class JournalsNotifier extends AbstractNotifier {
  /**
   * Initialize - listen for new or updated journal items
   */
  init() {
    const ref = this.db.ref('journals/organizations/' + this.organization.key);
    const watch = [
      { key: 'time', mentionsOnly: false, from: +new Date() },
      { key: 'updated', mentionsOnly: true, from: +new Date() }
    ];
    watch.forEach((conf) => {
      ref.orderByChild(conf.key).startAt(conf.from).on('child_added', (sn) => {
        const entry = sn.val();
        if (entry && entry[conf.key] >= conf.from) {
          conf.from = entry[conf.key];
          this.notify(entry, conf.mentionsOnly).then(
            () => sn.ref.child('mentions').remove()
          );
        }
      });
    });
  }

  /**
   * Gather causer, mentions, watchers, item and send the emails
   *
   * @param {Object} entry
   * @param {Boolean=} mentionsOnly
   * @return {Promise}
   */
  notify(entry, mentionsOnly) {
    let causer;
    let watchers;
    const mentionedUids = entry.mentions ? Object.keys(entry.mentions) : [];
    const mentions = [];
    let item;
    return Promise.all([
      this.getUser(entry.uid).then((user) => {
        causer = user;
      }),
      Promise.all(
        mentionedUids
          .filter(uid => uid !== entry.uid)
          .map(uid => this.getUser(uid).then(
            user => mentions.push(user)
          ))
      ),
      this.getItem(entry.id, entry.resource, entry.action === 'archive', true)
        .then((i) => {
          item = i;
          if (!mentionsOnly) {
            return this.getWatchers(i, mentionedUids.concat(entry.uid)).then((w) => {
              watchers = w;
            });
          }
          return undefined;
        })
    ]).then(() => Promise.all(
      mentions.map(
        watcher => this.sendMail(entry, item, watcher, causer, true)
      ).concat(
        mentionsOnly ? [] : watchers.map(
          watcher => this.sendMail(entry, item, watcher, causer)
        )
      )
    ));
  }

  /**
   * Send an email for a journal entry to a watcher
   *
   * @param {Object} entry
   * @param {Object} item
   * @param {Object} watcher
   * @param {Object} causer
   * @param {Boolean=} isMention
   *
   * @returns {Promise}
   */
  sendMail(entry, item, watcher, causer, isMention) {
    const href = this.href(entry.resource + '/' + entry.id);
    let status;
    if (entry.action === 'archive') {
      status = Config.resources[entry.resource].transitions.occasions.reverse().find(
        occasion => entry[occasion] === true
      );
    }

    let html = '<b>' + causer.displayName + '</b> ';
    if (isMention) {
      html += 'mentioned you while ' + entry.action.replace(/e$/, '') + 'ing ';
    } else {
      html += entry.action.replace(/t$/, 'te') + 'd ';
    }
    if (entry.action === 'comment') {
      html += 'on ';
    }
    html += '<a href="' + href + '">' + item.title + '</a>';
    if (status) {
      html += ' (<b>' + status + '</b>)';
    }
    if (entry.comment) {
      html += ':<br><br>';
      html += Mentions.linkMentions(
        entry.comment,
        (scheme, id) => (scheme === '@' ? this.href('user/' + id) : '')
      );
    }

    return super.sendMail({
      to: this.emailAddress(watcher.displayName, watcher.email),
      from: this.emailAddress(causer.displayName),
      subject: (isMention ? causer.displayName + ' mentioned you in ' : '') + item.title,
      html,
      text: html2text.fromString(html)
    });
  }
};
