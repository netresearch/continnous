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
  getNext() {
    return new Period(moment(this.date).add(1, 'quarter').toDate());
  }
  format() {
    return Vue.t('quarter')
      + ' ' + (this.quarter < 4 ? 'I'.repeat(this.quarter) : 'IV')
      + ' ' + this.date.getFullYear();
  }
}
