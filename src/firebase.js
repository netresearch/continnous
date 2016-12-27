import Firebase from 'firebase';

const config = {
  apiKey: 'AIzaSyCy4CP6XOpkZuAeiK4YhZWysu9FD2W4l-8',
  authDomain: 'continnous.firebaseapp.com',
  databaseURL: 'https://continnous.firebaseio.com',
  storageBucket: 'continnous.appspot.com',
  messagingSenderId: '552370645245',
};

Firebase.initializeApp(config);

export default Firebase;
