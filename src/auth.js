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

function setUser(user) {
  auth.ready = true;
  auth.user = user ? User.createFromAuth(user) : undefined;
  if (user) {
    Firebase.database().ref('/users/' + user.uid).set({
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
  }
}

Firebase.auth().onAuthStateChanged(setUser);
Firebase.auth().getRedirectResult().then((result) => {
  setUser(result.user);
});

export default auth;
