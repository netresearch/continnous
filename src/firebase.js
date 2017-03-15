import Firebase from 'firebase';

const config = require('../.firebaserc');

Firebase.initializeApp(config);

module.exports = Firebase;
