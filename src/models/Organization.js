import Firebase from '../firebase';
import auth from '../auth';

export default class Organization {
  constructor(key, data) {
    this.key = key;
    Object.assign(this, data);

    const ref = Firebase.database().ref('/journals/organizations/' + key);
    this.journal = {
      addEntry: (resource, personal, id, action, fields, comment, props) => ref.push(
        Object.assign({
          resource,
          personal,
          id,
          action,
          comment: comment || null,
          fields: fields || null,
          time: +new Date(),
          uid: auth.user.uid
        }, props || {})
      ),
      getRef: () => ref,
      getArchiveInfo(item) {
        const infoRef = ref.orderByChild('id').equalTo(item.id);
        return new Promise((resolve) => {
          infoRef.on('child_added', (sn) => {
            const archiveInfo = sn.val();
            if (archiveInfo.action === 'archive') {
              infoRef.off('child_added');
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
