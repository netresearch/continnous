const AbstractBackend = require('./Abstract');

module.exports = class NotifyAdminsOnMembershipRequest extends AbstractBackend {
  init() {
    const secRef = this.db.ref('security/organizations/' + this.organization.key + '/users');
    let firstLoaded = false;
    secRef.limitToFirst(1).on('child_added', (sn) => {
      if (!firstLoaded || firstLoaded === sn.key) {
        firstLoaded = sn.key;
        return;
      }
      this.handleMembershipRequest(sn.key);
    });
    secRef.on('child_changed', (sn) => {
      if (sn.val() !== '!' && sn.val() !== '?') {
        this.handleMembershipChanged(sn.key, sn.val());
      }
    });
  }
  handleMembershipRequest(uid) {
    this.getUser(uid).then((user) => {
      this.db.ref('/security/organizations/' + this.organization.key + '/users')
        .orderByValue().equalTo('admin')
        .once('value', (asn) => {
          asn.forEach((acsn) => {
            this.db.ref('users/organizations/' + this.organization.key + '/' + acsn.key).once('value', (ausn) => {
              this.sendMail({
                to: this.emailAddress(ausn.val().displayName, ausn.val().email),
                from: this.emailAddress(user.displayName, user.email),
                subject: 'Membership request',
                text: user.displayName
                + ' wants to become member of ' + this.organization.title
                + ' - click here to manage your users: '
                + this.href('settings/users')
              });
            });
          });
        });
    });
  }
  handleMembershipChanged(uid, role) {
    this.getUser(uid).then((user) => {
      const organization = this.organization;
      this.sendMail({
        to: this.emailAddress(user.displayName, user.email),
        from: this.emailAddress(),
        subject: 'Your membership',
        text: 'Hi ' + user.displayName + ',\n\n'
        + ' you are now ' + role + ' on ' + organization.title
        + ' [' + this.href() + ']'
      });
    });
  }
}
