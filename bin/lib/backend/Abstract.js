const NodeMailer = require('nodemailer');

let transport;

module.exports = class AbstractBackend {
  constructor(organization, firebase, rc) {
    this.organization = organization;
    if (!this.organization.title) {
      this.organization.title = this.organization.name + ' Innovation Platform';
    }
    this.db = firebase.database();
    this.rc = rc;
    if (!organization.domain) {
      let initialized = false;
      this.db.ref('domains').orderByValue().equalTo(organization.key).on('value', (sn) => {
        organization.domain = undefined;
        sn.forEach((dsn) => {
          if (!organization.domain) {
            organization.domain = dsn.key.replace(/:/g, '.');
          }
        });
        if (!initialized) {
          initialized = true;
          this.init();
        }
      });
    } else {
      this.init();
    }
  }
  init() {
  }
  getUser(uid) {
    return new Promise((resolve) => {
      this.db.ref('users/organizations/' + this.organization.key + '/' + uid).once('value', (sn) => {
        resolve(sn.val());
      });
    });
  }
  emailAddress(name, email) {
    return '"' + (name || this.organization.title) + '" '
      + '<' + (email || ('noreply@' + (this.organization.domain || this.rc.config.authDomain))) + '>';
  }
  href(path) {
    return 'https://' + (this.organization.domain || this.rc.config.authDomain + '/' + this.organization.key)
      + (path ? ('/' + path).replace(/^\/+/, '/') : '')
  }
  sendMail(mail) {
    mail.subject = '[' + this.organization.title + '] ' + mail.subject;
    if (!transport) {
      transport = NodeMailer.createTransport(this.rc.transport);
    }
    return transport.sendMail(mail).then(
      (info) => {
        console.log('Sent mail:'.green);
        console.log(info);
      },
      (error) => {
        console.error('Mail delivery failed');
        console.error(error);
      }
    );
  }
  updateOrganization(organization) {
    this.organization = organization;
  }
}
