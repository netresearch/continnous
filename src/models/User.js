import Firebase from '../firebase';

const props = ['email', 'displayName', 'uid', 'photoURL', 'elevate', 'inviteState', 'inviteBy'];

const setData = (user, d) => {
  props.forEach((key) => {
    if (d.hasOwnProperty(key)) {
      user[key] = d[key];
    }
  });
};

export default class User {
  constructor(data, organization) {
    this.elevate = 0;
    props.forEach((key) => {
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
    if (this.email) {
      ref.update({
        email: this.email,
        displayName: this.displayName || null,
        photoURL: this.photoURL || null
      });
    }
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
    const provider = authUser.providerData[0] || authUser;
    return new User({
      uid: authUser.uid,
      displayName: provider.displayName,
      photoURL: provider.photoURL || authUser.photoURL,
      email: authUser.email
    });
  }
}
