import Firebase from '../firebase';

export default class User {
  constructor(data, organization) {
    const setData = (d) => {
      this.email = d.email;
      this.displayName = d.displayName;
      this.uid = d.uid;
      this.photoURL = d.photoURL;
    };
    if (typeof data === 'object') {
      setData(data);
    } else if (typeof data === 'string') {
      if (!organization) {
        throw new Error('organization is required');
      }
      Firebase.database().ref('/organizations/' + organization.key + '/users/' + data).on('value', (s) => {
        setData(s.val());
      });
    } else {
      throw new Error('data must be user id or user data object');
    }
  }
  static createFromAuth(authUser) {
    return new User(authUser);
  }
}
