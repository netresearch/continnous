import Firebase from 'firebase';

const config = require('../.firebaserc').config;

Firebase.initializeApp(config);

export default Firebase;
