import Firebase from '../firebase';
import auth from '../auth';

export default class Organization {
  constructor(key, data) {
    this.key = key;
    Object.assign(this, data);

    const journalRef = Firebase.database().ref('/journals/organizations/' + key);
    this.journal = {
      addEntry(resource, personal, id, action, fields, comment, props) {
        const push = () => {
          journalRef.push(Object.assign({
            resource,
            personal,
            id,
            action,
            comment: comment || null,
            fields: fields || null,
            time: +new Date(),
            uid: auth.user.uid
          }, props || {}));
        };
        if (action !== 'comment') {
          journalRef.orderByChild('id').equalTo(id).limitToLast(1).once('value', (sn) => {
            sn.forEach((csn) => {
              const last = csn.val();
              if (last.action === action && last.uid === auth.user.uid) {
                if (last.fields) {
                  if (fields) {
                    fields = fields.concat(last.fields).filter((v, i, a) => a.indexOf(v) === i);
                  } else {
                    fields = last.fields;
                  }
                }
                csn.ref.remove();
              }
            });
            push();
          });
        } else {
          push();
        }
      },
      getRef: () => journalRef,
      getArchiveInfo(item) {
        const ref = journalRef.orderByChild('id').equalTo(item.id);
        return new Promise((resolve) => {
          ref.on('child_added', (sn) => {
            const archiveInfo = sn.val();
            if (archiveInfo.action === 'archive') {
              ref.off('child_added');
              const states = ['discarded', 'accepted', 'completed', 'heeded', 'outdated'];
              const doneStates = ['accepted', 'completed', 'heeded'];
              archiveInfo.occasion = states.find(status => archiveInfo[status] === true);
              archiveInfo.icon = doneStates.indexOf(archiveInfo.occasion) < 0 ? 'block' : 'done';
              resolve(archiveInfo);
            }
          });
        });
      }
    };
  }
}
