import Journal from './Journal';
import Watchers from './Watchers';

let current;

export default class Organization {
  /**
   * @param {Organization} newCurrent
   */
  static set current(newCurrent) {
    if (newCurrent && !(newCurrent instanceof Organization)) {
      throw new Error('current organization must be of type Organization');
    }
    current = newCurrent;
  }

  /**
   * @return {Organization}
   */
  static get current() {
    if (!current) {
      throw new Error('No current organization set');
    }
    return current;
  }

  constructor(key, data) {
    this.key = key;
    Object.assign(this, data);
    this.journal = new Journal(this);
    this.watchers = new Watchers(this);
  }
}
