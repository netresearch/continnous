import Firebase from './firebase';
import User from './models/User';

const auth = {
  ready: false,
  user: undefined,
  login() {
    const provider = new Firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    Firebase.auth().signInWithRedirect(provider);
  },
  logout() {
    Firebase.auth().signOut().then(() => {
      auth.user = undefined;
    });
  }
};

Firebase.auth().onAuthStateChanged((user) => {
  auth.ready = true;
  auth.user = user ? User.createFromAuth(user) : undefined;
});
Firebase.auth().getRedirectResult().then((result) => {
  auth.ready = true;
  auth.user = result.user ? User.createFromAuth(result.user) : undefined;
});

export default auth;
