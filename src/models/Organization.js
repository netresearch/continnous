import sortBy from 'sort-by';
import Firebase from '../firebase';
import auth from '../auth';

export default class Organization {
  constructor(key, data) {
    this.key = key;
    Object.assign(this, data);

    const journalRef = Firebase.database().ref('/journals/organizations/' + key);
    this.journal = {
      entries: [],
      addEntry(resource, personal, id, action, fields) {
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
          journalRef.push({
            resource,
            personal,
            id,
            action,
            fields: fields || null,
            time: +new Date(),
            uid: auth.user.uid
          });
        });
      },
      getRef: () => journalRef
    };
    journalRef.orderByChild('personal').equalTo(false).limitToLast(10)
      .on('child_added', (snapshot) => {
        const entry = Object.assign({ journalId: snapshot.key }, snapshot.val());
        const path = '/' + (entry.action === 'remove' ? 'trash' : 'resources')
          + '/organizations/' + key
          + '/organization/' + entry.resource
          + '/' + entry.id + '/title';
        Firebase.database().ref(path).once('value', (s) => {
          entry.title = s.val();
          if (entry.title) {
            this.journal.entries.unshift(entry);
            this.journal.entries.sort(sortBy('-time'));
          }
        }, () => {});
      });
    journalRef.on('child_removed', (snapshot) => {
      this.journal.entries.forEach((entry, i) => {
        if (entry.journalId === snapshot.key) {
          this.journal.entries.splice(i, 1);
        }
      });
    });
  }
}
