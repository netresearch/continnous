import extend from 'extend';
import Firebase from '../firebase';
import Mentions from './Mentions';
import auth from '../auth';

/**
 * Save an entry or updates to an entry
 * - Adds mentions present in comment
 * - Makes mentioned users watch/unwatch the item
 *   (not forced - so watch is not set to true, until those users
 *    actually view the item)
 *
 * @param {Journal} journal The journal object
 * @param {Object} item The resource item
 * @param {Object} entry The full entry or updates to it
 * @param {String=} id The id of the entry to update
 * @param {String=} id The id of the entry to update
 * @param {Object=} current The current entry object if present
 * @return {Promise}
 */
const save = (journal, item, entry, id, current) => {
  const ref = id ? journal.getRef().child(id) : journal.getRef().push();

  if (id && !current) {
    return new Promise(r => ref.once('value', sn => (sn.exists() ? r(sn.val()) : Promise.reject())))
      .then(c => save(journal, item, entry, id, c));
  }

  if (entry.comment) {
    const cm = current ? Mentions.getMentions(current.comment, '@') : [];
    entry.mentions = entry.mentions || {};
    Mentions.getMentions(entry.comment, '@').forEach((uid) => {
      if (cm.indexOf(uid) < 0) {
        entry.mentions[uid] = true;
      }
    });
  }

  const promises = [];
  const organization = journal.organization;
  if (entry.uid && entry.uid !== item.creator) {
    promises.push(organization.watchers.add(item, entry.uid, true));
  }
  if (entry.mentions) {
    Object.keys(entry.mentions).forEach((uid) => {
      promises.push(organization.watchers.set(item, uid, entry.mentions[uid]));
      if (!entry.mentions[uid]) {
        entry.mentions[uid] = null;
      }
    });
  }

  return ref.update(entry).then(() => Promise.all(promises));
};

export default class Journal {
  /**
   * Constructor
   *
   * @param {Organization} organization
   */
  constructor(organization) {
    this.organization = organization;

    const ref = Firebase.database().ref(
      '/journals/organizations/' + organization.key
    );

    /**
     * Don't set this.ref but use getter because of trouble with Vue bindings
     *
     * @return {firebase.database.Reference}
     */
    this.getRef = () => ref;
  }

  /**
   * Add an entry
   *
   * @param {Object} item
   * @param {String} resource
   * @param {Boolean} personal
   * @param {String} action
   * @param {Array=} fields
   * @param {String=} comment
   * @param {Object=} props
   * @return {Promise}
   */
  addEntry(item, resource, personal, action, fields, comment, props) {
    let entry = extend(true, {
      id: item.id,
      resource,
      personal,
      action,
      comment: comment || null,
      fields: fields || null,
      time: +new Date(),
      uid: auth.user.uid
    }, props || {});

    if (action === 'update') {
      const prevRef = this.getRef().orderByChild('id').equalTo(item.id).limitToLast(1);
      return new Promise(r => prevRef.once('value', sn => r(sn)))
        .then((sn) => {
          let ret;
          sn.forEach((csn) => {
            const last = csn.val();
            if (last.action === action && last.uid === entry.uid) {
              if (last.fields && fields) {
                // extend simply merges array elements by offset, thus this:
                entry.fields = last.fields.concat(fields).filter((v, i, a) => a.indexOf(v) === i);
                delete last.fields;
              }
              entry = extend(last, entry);
              ret = csn.ref.remove();
            }
          });
          return ret;
        })
        .then(() => save(this, item, entry));
    }

    return save(this, item, entry);
  }

  /**
   * Update the comment of an entry
   *
   * @param {String} id The journal entry ID
   * @param {Object} item
   * @param {String} comment
   * @param {Object=} current The current entry object if present
   * @return {Promise}
   */
  updateComment(id, item, comment, current) {
    const updates = { comment, updated: +new Date(), };
    return save(this, item, updates, id, current);
  }

  /**
   * Remove all entries for an item
   *
   * @param item
   * @return {Promise}
   */
  clear(item) {
    return new Promise((resolve) => {
      this.organization.journal.getRef()
        .orderByChild('id')
        .equalTo(item.id)
        .once('value', sn => resolve(sn));
    }).then((sn) => {
      const promises = [];
      sn.forEach((csn) => {
        promises.push(csn.ref.remove());
      });
      return Promise.all(promises);
    });
  }

  /**
   * Get latest archive information for an item
   *
   * @param {Object} item
   * @return {Promise.<Object>}
   */
  getArchiveInfo(item) {
    const ref = this.getRef();
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
}
