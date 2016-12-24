const firebase = require('firebase');

export default class Organization {
  constructor(uid, name) {
    this.uid = uid;
    this.name = name;
  }
  static getByDomain(domain) {
    const orgsRef = firebase.database().ref('organizations').orderByChild('domain').equalTo(domain);
    const organizations = [];
    organizations.loading = true;
    orgsRef.on('value', () => {
      organizations.loading = false;
    });
    orgsRef.on('child_added', (snapshot) => {
      organizations.push(new Organization(snapshot.key, snapshot.val().name));
    });
    orgsRef.on('child_removed', (snapshot) => {
      organizations.forEach((org, index) => {
        if (org.uid === snapshot.key) {
          organizations.splice(index, 1);
        }
      });
    });
    orgsRef.on('child_changed', (snapshot) => {
      organizations.forEach((org) => {
        const my = org;
        if (my.uid === snapshot.key) {
          my.name = snapshot.val().name;
        }
      });
    });
    return organizations;
  }
}
