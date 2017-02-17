import Firebase from '../firebase';

const setData = (user, d) => {
  ['email', 'displayName', 'uid', 'photoURL', 'elevate'].forEach((key) => {
    if (d.hasOwnProperty(key)) {
      user[key] = d[key];
    }
  });
};

export default class User {
  constructor(data, organization) {
    this.elevate = 0;
    ['email', 'displayName', 'uid', 'photoURL'].forEach((key) => {
      this[key] = undefined;
    });
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
    const orgKey = typeof organization === 'object' ? organization.key : organization;
    if (this.ref) {
      if (this.ref.orgKey === orgKey) {
        return this.ref();
      }
      this.ref().off('value');
    }
    const ref = Firebase.database().ref('/users/organizations/' + orgKey + '/' + this.uid);
    this.ref = () => ref;
    this.ref.orgKey = orgKey;
    ref.on('value', (s) => {
      setData(this, s.val() || {});
    });
    return ref;
  }
  toString() {
    return this.displayName || '?';
  }
  static createFromAuth(authUser) {
    return new User(authUser);
  }
}
