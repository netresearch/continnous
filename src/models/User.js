import Firebase from '../firebase';

const setData = (user, d) => {
  user.email = d.email;
  user.displayName = d.displayName;
  user.uid = d.uid || user.uid;
  user.photoURL = d.photoURL;
  user.elevate = d.elevate || 0;
};

export default class User {
  constructor(data, organization) {
    if (typeof data === 'object') {
      setData(this, data);
    } else if (typeof data === 'string') {
      if (!organization) {
        throw new Error('organization is required');
      }
      this.uid = data;
      this.bind(organization);
    } else {
      throw new Error('data must be user id or user data object');
    }
  }
  bind(organization) {
    if (this.ref) {
      if (this.ref.orgKey === organization.key) {
        return;
      }
      this.ref().off('value');
    }
    const ref = Firebase.database().ref('/organizations/' + organization.key + '/users/' + this.uid);
    this.ref = () => ref;
    this.ref.orgKey = organization.key;
    ref.on('value', (s) => {
      setData(this, s.val());
    });
  }
  toString() {
    return this.displayName || '?';
  }
  static createFromAuth(authUser) {
    return new User(authUser);
  }
}
