import moment from 'moment';
import Vue from 'vue';

export default class Period {
  constructor(date) {
    this.date = date || new Date();
    const m = moment(this.date);
    this.quarter = m.quarter();
    this.start = m.startOf('quarter').valueOf();
    this.end = m.endOf('quarter').valueOf();
  }
  getPrevious() {
    return new Period(moment(this.date).subtract(1, 'quarter').toDate());
  }
  getNext() {
    return new Period(moment(this.date).add(1, 'quarter').toDate());
  }
  getId() {
    return 'q' + this.quarter + '-' + this.date.getFullYear();
  }
  static getById(id) {
    const matches = id ? id.match(/^q([1-4])-([0-9]{4})$/) : null;
    if (!matches) {
      return new Period();
    }
    return new Period(moment().year(matches[2]).quarter(matches[1]).toDate());
  }
  format() {
    return Vue.t('quarter')
      + ' ' + (this.quarter < 4 ? 'I'.repeat(this.quarter) : 'IV')
      + ' ' + this.date.getFullYear();
  }
}
