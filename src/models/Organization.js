export default class Organization {
  constructor(key, data) {
    this.key = key;
    Object.assign(this, data);
  }
}
