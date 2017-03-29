const AbstractNotifier = require('./Abstract');

const InvitationStates = {
  NEW: 0,
  SENT: -1,
  NOTIFY_HOST: 1,
  ADMIN_INFORMED: -2,
  ADMIN_ASSIGNED_ROLE: 2
};

module.exports = class InvitesNotifier extends AbstractNotifier {
  /**
   * Initialize - listen for changes
   */
  init() {
    const userRef = this.db.ref('users/organizations/' + this.organization.key);
    const ref = userRef.orderByChild('inviteState').startAt(0);
    ref.on('child_added', this.handleInvitedUser.bind(this));
  }

  handleInvitedUser(sn) {
    const user = Object.assign({ uid: sn.key }, sn.val());
    const state = user.inviteState;
    if (state === InvitationStates.NEW) {
      let movedRef;
      this.fb.auth().getUserByEmail(user.email).then(
        (existingUser) => {
          if (existingUser.uid !== user.uid) {
            movedRef = sn.ref.parent.child(existingUser.uid);
            user.uid = existingUser.uid;
          }
        },
        () => {
          return this.fb.auth().createUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
        }
      )
        .then(
          () => this.handleNewInvite(user)
        )
        .then((newState) => {
          if (movedRef) {
            user.inviteState = newState;
            delete user.uid;
            return movedRef.set(user).then(() => sn.ref.remove());
          }
          return sn.ref.child('inviteState').set(newState);
        })
        .catch(
          error => sn.ref.child('inviteState').set(error + '')
        );
    } else if (state === InvitationStates.ADMIN_ASSIGNED_ROLE) {
      this.sendInvitationMail(user);
      sn.ref.child('inviteState').set(InvitationStates.SENT);
    } else if (state === InvitationStates.NOTIFY_HOST) {
      this.notifyHost(user);
      sn.ref.child('inviteState').remove();
    }
  }

  handleNewInvite(user) {
    let host;
    let domainGroup;
    return Promise.all([
      this.getUser(user.inviteBy).then((h) => { host = h; }),
      new Promise((resolve) => {
        this.db.ref('security/organizations/' + this.organization.key + '/domains').once('value', (dsn) => {
          const emailDomain = user.email.split('@').pop();
          dsn.forEach((gdsn) => {
            if (gdsn.val().find(domain => domain === emailDomain)) {
              domainGroup = gdsn.key;
              return true;
            }
            return false;
          });
          resolve();
        });
      })
    ]).then(() => {
      if (domainGroup) {
        this.sendInvitationMail(user, host);
        return InvitationStates.SENT;
      }
      this.sendAdminMails({
        from: this.emailAddress(host.displayName, host.email),
        subject: 'Member invitation',
        text: 'I invited ' + user.displayName + ' (' + user.email + ')'
        + ' to ' + this.organization.title
        + ' - please assign him/her a role to finally send an invitation: '
        + this.href('settings/users')
        + '\n\nRegards,\n' + host.displayName
      });
      return InvitationStates.ADMIN_INFORMED;
    });
  }

  sendInvitationMail(user, host) {
    if (!host) {
      this.getUser(user.inviteBy).then(h => this.sendInvitationMail(user, h));
    } else {
      this.sendMail({
        to: this.emailAddress(user.displayName, user.email),
        from: this.emailAddress(host.displayName, host.email),
        subject: 'Membership invitation',
        text: 'You are invited to join ' + this.organization.title
        + ' - feel free to sign up on ' + this.href('settings/users')
      });
    }
  }

  notifyHost(user) {
    this.getUser(user.inviteBy).then((host) => {
      return this.sendMail({
        to: this.emailAddress(host.displayName, host.email),
        from: this.emailAddress(user.displayName, user.email),
        subject: 'Invitation accepted',
        text: 'I just followed your invitation to ' + this.organization.title
        + ' - see you there.\n\nRegards,\n' + user.displayName
      });
    });
  }
}