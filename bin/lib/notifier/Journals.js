const AbstractNotifier = require('./Abstract');
const html2text = require('html-to-text');
const Config = require('../../../src/models/Config');

/**
 * Send emails to item watchers on new journal entries
 *
 * @type {JournalsNotifier}
 */
module.exports = class JournalsNotifier extends AbstractNotifier {
  /**
   * Initialize - listen for new journal items
   */
  init() {
    let fromTime = +new Date();
    this.db.ref('journals/organizations/' + this.organization.key)
      .orderByChild('time').startAt(fromTime).on('child_added', (sn) => {
      const entry = sn.val();
      if (entry && entry.time >= fromTime) {
        fromTime = entry.time;
        this.notifyWatchers(entry);
      }
    });
  }

  /**
   * Gather causer, watchers, item and send the emails
   *
   * @param {Object} entry
   */
  notifyWatchers(entry) {
    let causer;
    let watchers;
    let item;
    Promise.all([
      this.getUser(entry.uid).then((user) => {
        causer = user;
      }),
      this.getItem(entry.id, entry.resource, entry.action === 'archive', true)
        .then((i) => {
          item = i;
          return this.getWatchers(i, [entry.uid]);
        })
        .then((w) => {
          watchers = w;
        })
    ]).then(() => {
      watchers.forEach((watcher) => {
        this.sendWatcherMail(entry, item, watcher, causer);
      });
    });
  }

  /**
   * Send an email for a journal entry to a watcher
   *
   * @param {Object} entry
   * @param {Object} item
   * @param {Object} watcher
   * @param {Object} causer
   *
   * @returns {Promise}
   */
  sendWatcherMail(entry, item, watcher, causer) {
    const href = this.href(entry.resource + '/' + entry.id);
    let status;
    if (entry.action === 'archive') {
      status = Config.resources[entry.resource].transitions.occasions.reverse().find(
        occasion => entry[occasion] === true
      );
    }
    return this.sendMail({
      to: this.emailAddress(watcher.displayName, watcher.email),
      from: this.emailAddress(causer.displayName),
      subject: item.title,
      html: (() => {
        let html = '<b>' + causer.displayName + '</b> ';
        html += entry.action + 'd ' + (entry.action === 'comment' ? 'on ' : '');
        html += '<a href="' + href + '">' + item.title + '</a>';
        if (status) {
          html += ' (<b>' + status + '</b>)';
        }
        if (entry.comment) {
          html += ':<br><br>';
          html += entry.comment;
        }
        return html;
      })(),
      text: (() => {
        let text = causer.displayName + ' ' + entry.action + 'd ';
        text += (entry.action === 'comment' ? 'on ' : '');
        text += item.title + ' [' + href + ']';
        if (status) {
          text += ' (' + status + ')';
        }
        if (entry.comment) {
          text += ':\n\n' + html2text.fromString(entry.comment);
        }
        return text;
      })()
    });
  }
}
