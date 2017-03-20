const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.sendRegistrationMails = functions.database.ref('/security/organizations/{organization}/users/{uid}').onWrite((event) => {
  if (event.data.previous.exists() || !event.data.exists()) {
    return;
  }
  admin.database().ref('users/organizations/' + event.params.organization + '/' + event.params.uid).once('value', (sn) => {
    const user = sn.val();
    admin.database().ref('/security/organizations/' + event.params.organization + '/users')
      .orderByValue().equalTo('admin').once('value', (asn) => {
         asn.forEach((acsn) => {
           admin.database().ref('users/organizations/' + event.params.organization + '/' + acsn.key).once('value', (ausn) => {
             admin.database().ref('mails').push({
               to: '"' + ausn.val().displayName + '" <' + ausn.val().email + '>',
               from: '"' + user.displayName + '" <' + user.email + '>',
               subject: 'Membership request',
               text: user.displayName
                + ' wants to become member of the organization '
                + event.params.organization
                + ' - click here to manage your users: '
                + 'https://' + functions.config().firebase.authDomain
                + '/' + event.params.organization + '/settings/users'
             });
           });
         });
      });
  });
});
