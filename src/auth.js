import Firebase from './firebase';
import User from './models/User';
import Current from './models/Current';

const auth = {
  ready: false,
  login() {
    const provider = new Firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    Firebase.auth().signInWithRedirect(provider);
    // Firebase.auth().signInWithPopup(provider);
  },
  logout() {
    Current.user = undefined;
    Firebase.auth().signOut();
  }
};

function setUser(user) {
  auth.ready = true;
  Current.user = user ? User.createFromAuth(user) : undefined;
}

Firebase.auth().onAuthStateChanged(setUser);
Firebase.auth().getRedirectResult().then((result) => {
  setUser(result.user);
});

export default auth;
