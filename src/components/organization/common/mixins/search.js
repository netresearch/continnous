import Flashlight from '../../../../models/Flashlight';
import User from '../../../../models/User';
import Current from '../../../../models/Current';

export default {
  methods: {
    getFlashlight() {
      if (!this.flashlight) {
        this.flashlight = new Flashlight();
        this.flashlight.ignoreSubsequents();
      }
      return this.flashlight;
    },
    searchUsers(search) {
      return new Promise((resolve) => {
        this.getFlashlight().suggest(search, 'users').then((results) => {
          const users = [];
          if (results.length) {
            results[0].hits.forEach((hit) => {
              /* eslint-disable no-underscore-dangle */
              const user = new User(
                Object.assign({ uid: hit._id }, hit._source), Current.organization
              );
              users.push(user);
            });
          }
          resolve(users);
        });
      });
    }
  }
};
