import moment from 'moment';
import Firebase from '../../../firebase';
import Current from '../../../models/Current';
import ResourceImage from './Image';

const viewed = {};

export default {
  components: { ResourceImage },
  methods: {
    moment(time) {
      return moment(time);
    },

    getLikesRef(id, all, byUser) {
      const path = '/likes/organizations/' + Current.organization.key + '/by' + (byUser ? 'User' : 'Resource');
      const lastParts = [id, Current.user.uid];
      if (byUser) {
        lastParts.reverse();
      }
      if (all) {
        return Firebase.database().ref(path + '/' + lastParts.shift());
      }
      return Firebase.database().ref(path + '/' + lastParts.join('/'));
    },

    /**
     * @param {Item} item
     * @param {Boolean} like
     */
    setLike(item, like) {
      const byResourceRef = this.getLikesRef(item.id, false, false);
      const byUserRef = this.getLikesRef(item.id, false, true);
      const factor = Current.user.elevate ? Current.user.elevate + 1 : 1;
      (like ? byResourceRef.set(factor) : byResourceRef.remove()).then(() => {
        (like ? byUserRef.set(factor) : byUserRef.remove()).then(() => {
          if (!item.stats) {
            item.stats = {};
          }
          item.stats.likes = Math.max(0, (item.stats.likes || 0) + (like ? 1 : -1));
          item.ref().child('stats').update({
            likes: item.stats.likes
          });

          this.updateRank(item);

          if (like) {
            Current.organization.journal.addEntry(item, 'like');
          } else {
            // Remove all like journal entries
            Current.organization.journal.getRef().orderByChild('id').equalTo(item.id).once('value', (snapshot) => {
              snapshot.forEach((childSnapshot) => {
                const entry = childSnapshot.val();
                if (entry.uid === Current.user.uid && entry.action === 'like') {
                  childSnapshot.ref.remove();
                }
              });
            });
          }
        });
      });
    },

    /**
     * @param {Item} item
     */
    trackView(item) {
      if (!this.trackedViews) {
        this.trackedViews = {};
      }
      if (this.trackedViews[item.id]) {
        return;
      }
      this.trackedViews[item.id] = true;
      if (!viewed[Current.user.uid]) {
        viewed[Current.user.uid] = {};
      }
      const statsRef = item.ref().child('stats');
      if (!viewed[Current.user.uid][item.id]) {
        viewed[Current.user.uid][item.id] = true;
        Firebase.database().ref(
          '/views/organizations/' + Current.organization.key + '/' + item.id + '/' + Current.user.uid
        ).once('value', (sn) => {
          if (!sn.val()) {
            sn.ref.set(1);
            if (!item.stats) {
              item.stats = {};
            }
            item.stats.uniqueViews = (item.stats.uniqueViews || 0) + 1;
            statsRef.update({
              uniqueViews: item.stats.uniqueViews
            });
          }
        });
      }
      statsRef.update({
        views: item.stats && item.stats.views ? item.stats.views + 1 : 1
      });
    },

    /**
     * @param {Item} item
     */
    updateRank(item) {
      Promise.all([
        new Promise((resolve) => {
          this.getLikesRef(item.id, true, false).once('value', (sn) => {
            let sumLikes = 0;
            sn.forEach((csn) => {
              sumLikes += csn.val();
            });
            resolve(sumLikes / (item.stats ? item.stats.uniqueViews || 1 : 1));
          });
        }),
        new Promise((resolve) => {
          Firebase.database().ref(
            '/scorings/organizations/' + Current.organization.key + '/' + item.id
          ).once('value', (sn) => {
            let sumScorings = 0;
            let numScorings = 0;
            sn.forEach((csn) => {
              let sumCriteria = 0;
              let numCriteria = 0;
              let factor = 1;
              csn.forEach((ccsn) => {
                if (ccsn.key === '_elevate') {
                  factor += ccsn.val();
                } else {
                  sumCriteria += ccsn.val();
                  numCriteria++;
                }
              });
              /* eslint-disable no-underscore-dangle */
              sumScorings += factor * (numCriteria ? sumCriteria / numCriteria : 0);
              numScorings += factor;
            });
            resolve(numScorings ? sumScorings / numScorings : 0);
          });
        }),
      ]).then((factors) => {
        let sum = 0;
        factors.forEach((factor) => { sum += factor; });
        item.ref().update({
          rank: sum / factors.length
        });
      });
    }
  },
};
