import Firebase from '../firebase';
import auth from '../auth';

export default class Watchers {
  constructor(organization) {
    const ref = Firebase.database().ref(
      '/watchers/organizations/' + organization.key
    );
    // Don't set this.ref but use getter because of trouble with Vue bindings
    this.getRef = () => ref;
  }

  set(item, uid, watching, force) {
    const ref = this.getRef().child(item.id + '/' + uid);
    if (force) {
      if (uid === item.creator ? watching : !watching) {
        return ref.remove();
      }
      return ref.set(!!watching);
    }
    return new Promise(resolve => ref.once('value', resolve))
      .then((sn) => {
        if (!sn.exists() && watching) {
          return ref.set(1);
        } else if (sn.val() === 1 && !watching) {
          return ref.remove();
        }
        return Promise.resolve();
      });
  }

  get(item, uid) {
    const ref = this.getRef().child(item.id + '/' + uid);
    const watcher = {
      isWatching: undefined,
      toggle: () => this.set(item, uid, !watcher.isWatching, true),
      off: () => ref.off('value')
    };
    ref.on('value', (sn) => {
      if (sn.val() === 1 && uid === auth.user.uid) {
        watcher.isWatching = true;
        ref.set(true);
      } else {
        watcher.isWatching = sn.exists() ? sn.val() : uid === item.creator;
      }
    });
    return watcher;
  }

  add(item, uid, force) {
    return this.set(item, uid, true, force);
  }

  remove(item, uid, force) {
    return this.set(item, uid, false, force);
  }

  clear(item) {
    return this.getRef().child(item.id).remove();
  }
}
