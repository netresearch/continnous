import sortBy from 'sort-by';
import Firebase from '../firebase';
import auth from '../auth';
import User from './User';

export default class Organization {
  constructor(key, data) {
    this.key = key;
    Object.assign(this, data);

    const journalRef = Firebase.database().ref('/journals/organizations/' + key);
    this.journal = {
      entries: [],
      addEntry(resource, id, action, fields) {
        return journalRef.push({
          resource,
          id,
          action,
          fields: fields || null,
          time: +new Date(),
          uid: auth.user.uid
        });
      }
    };
    journalRef.orderByChild('time').limitToLast(10).on('child_added', (snapshot) => {
      const entry = Object.assign({}, snapshot.val());
      const path = '/' + (entry.action === 'remove' ? 'trash' : 'resources')
        + '/organizations/' + key
        + '/organization/' + entry.resource
        + '/' + entry.id + '/title';
      Firebase.database().ref(path).once('value', (s) => {
        entry.title = s.val();
        entry.user = new User(entry.uid, this);
        if (entry.title) {
          this.journal.entries.unshift(entry);
          this.journal.entries.sort(sortBy('-time'));
        }
      }, () => {});
    });
  }
}
