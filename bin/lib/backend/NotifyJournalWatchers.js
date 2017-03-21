module.exports = class NotifyJournalWatchers {
  init() {
    const entry = event.data.val();
    const org = event.params.organization;
    const db = admin.database();
    if (entry.personal) {
      return;
    }
    let organization;
    let sender;
    const users = [];
    let item;
    Promise.all([
      new Promise((resolve) => {
        loadOrganisation(org).then((o) => {
          organization = o;
          resolve();
        });
      }),
      new Promise((resolve) => {
        db.ref('users/organizations/' + org + '/' + entry.uid).once('value', (ssn) => {
          sender = ssn.val();
          resolve();
        });
      }),
      new Promise((resolve, reject) => {
        new Promise((itemLoaded) => {
          const loadItem = (archive, tryArchiveOpposite) => {
            const path = '/' + (archive ? 'archive' : 'resources')
              + '/organizations/' + org + '/organization'
              + '/' + entry.resource + '/' + entry.id;
            db.ref(path).once('value', (isn) => {
              item = isn.val();
              item.archive = archive;
              if (item) {
                itemLoaded();
              } else if (tryArchiveOpposite) {
                loadItem(!archive);
              } else {
                reject();
              }
            });
          };
          loadItem(entry.action === 'archive', true);
        }).then(() => {
          const uids = [item.creator];
          db.ref('watchers/' + org + '/' + entry.id).once('value', (wsn) => {
            wsn.forEach((wcsn) => {
              if (uids.indexOf(wcsn.key) === -1) {
                uids.push(wcsn.key);
              }
            });
            uids.forEach((uid, i) => {
              const r = () => {
                if (i === uids.length - 1) {
                  resolve();
                }
              };
              if (uid === entry.uid) {
                r();
                return;
              }
              db.ref('/security/organizations/' + org + '/users/' + uid).once('value', (ugsn) => {
                if (ugsn.val() === '?' || ugsn.val() === '!') {
                  r();
                  return;
                }
                db.ref('users/organizations/' + org + '/' + uid).once('value', (usn) => {
                  users.push(usn.val());
                  r();
                });
              });
            });
          });
        });
      })
    ]).then(() => {
      const base = 'https://' + (organization.domain || domain + '/' + org);
      const href = base + '/' + entry.resource + '/' + entry.id;
      users.forEach((user) => {
        db.ref('mails').push({
          to: '"' + user.displayName + '" <' + user.email + '>',
          from: '"' + sender.displayName + '" <noreply@' + (organization.domain || domain) + '>',
          subject: '[' + organization.title + '] ' + item.title,
          html: (() => {
            let html = '<b>' + sender.displayName + '</b> ';
            html += entry.action + 'd ' + (entry.action === 'comment' ? 'on ' : '');
            html += '<a href="https://' + href + '">' + item.title + '</a>';
            if (entry.action === 'archive') {
              html += ' (<b>' + (entry.completed ? 'completed' : 'discarded') + '</b>)';
            }
            if (entry.comment) {
              html += ':<br><br>';
              html += entry.comment;
            }
            return html;
          })(),
          text: (() => {
            let text = sender.displayName + ' ' + entry.action + 'd ';
            text += (entry.action === 'comment' ? 'on ' : '');
            text += item.title + ' [' + href + ']';
            if (entry.action === 'archive') {
              text += ' (' + (entry.completed ? 'completed' : 'discarded') + ')';
            }
            if (entry.comment) {
              text += ':\n\n' + html2text.fromString(entry.comment);
            }
            return text;
          })()
        });
      });
    });
  }
}