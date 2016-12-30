// import Organization from './Organization';

export default class User {
  constructor(data) {
    this.email = data.email;
    this.displayName = data.displayName;
    this.uid = data.uid;
    this.photoURL = data.photoURL;
  }
  static createFromAuth(authUser) {
    return new User(authUser);
  }
}
