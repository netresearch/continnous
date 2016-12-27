const firebase = require('firebase');

export default class Organization {
  constructor(id, data) {
    Object.assign(this, data);
    this.valid = true;
  }
  static getByKey(key) {
    const orgsRef = firebase.database().ref('organizations/' + key);
    let organization;
    return new Promise((resolve, reject) => {
      orgsRef.on('value', (snapshot) => {
        if (!snapshot.val()) {
          if (organization) {
            organization.valid = false;
          } else {
            reject();
          }
          return;
        }
        if (organization) {
          Object.assign(organization, snapshot.val());
        } else {
          organization = new Organization(key, snapshot.val());
          resolve(organization);
        }
      });
    });
  }
}
