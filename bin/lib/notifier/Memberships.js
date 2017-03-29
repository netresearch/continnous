const AbstractNotifier = require('./Abstract');

/**
 * - Notify admins on new membership requests
 * - Notify users on membership changes (role changed)
 *
 * @type {MembershipsNotifier}
 */
module.exports = class MembershipsNotifier extends AbstractNotifier {
  /**
   * Initialize - listen for changes
   */
  init() {
    const secRef = this.db.ref('security/organizations/' + this.organization.key + '/users');
    let firstLoaded = false;
    secRef.limitToFirst(1).on('child_added', (sn) => {
      if (!firstLoaded || firstLoaded === sn.key) {
        firstLoaded = sn.key;
        return;
      }
      if (sn.val() === '?') {
        this.handleMembershipRequest(sn.key);
      }
    });
    secRef.on('child_changed', (sn) => {
      if (sn.val() !== '!' && sn.val() !== '?') {
        this.handleMembershipChanged(sn.key, sn.val());
      }
    });
  }

  /**
   * Send email to all admins and inform them about the new request
   *
   * @param {String} uid
   */
  handleMembershipRequest(uid) {
    this.getUser(uid).then((user) => {
      this.sendAdminMails({
        from: this.emailAddress(user.displayName, user.email),
        subject: 'Membership request',
        text: user.displayName
        + ' wants to become member of ' + this.organization.title
        + ' - click here to manage your users: '
        + this.href('settings/users')
      });
    });
  }

  /**
   * Send an email to the user and inform him about the new role
   *
   * @param {String} uid
   * @param {String} role
   */
  handleMembershipChanged(uid, role) {
    this.getUser(uid).then((user) => {
      if (user.lastVisit) {
        const organization = this.organization;
        this.sendMail({
          to: this.emailAddress(user.displayName, user.email),
          from: this.emailAddress(),
          subject: 'Your membership',
          text: 'Hi ' + user.displayName + ',\n\n'
          + ' you are now ' + role + ' on ' + organization.title
          + ' [' + this.href() + ']'
        });
      }
    });
  }
}
