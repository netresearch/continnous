import Firebase from 'firebase';

const config = require('../.firebaserc').config;

Firebase.initializeApp(config);

module.exports = Firebase;
