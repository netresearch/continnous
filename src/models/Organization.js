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
      getRef: () => journalRef
    };
  }
}
