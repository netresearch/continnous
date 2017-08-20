import Journal from './Journal';
import Watchers from './Watchers';

export default class Organization {
  constructor(key, data) {
    this.key = key;
    Object.assign(this, data);
    this.journal = new Journal(this);
    this.watchers = new Watchers(this);
  }
}
