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
    // Firebase.auth().signInWithPopup(provider);
  },
  logout() {
    auth.user = undefined;
    Firebase.auth().signOut();
  }
};

function setUser(user) {
  auth.ready = true;
  auth.user = user ? User.createFromAuth(user) : undefined;
}

Firebase.auth().onAuthStateChanged(setUser);
Firebase.auth().getRedirectResult().then((result) => {
  setUser(result.user);
});

export default auth;
