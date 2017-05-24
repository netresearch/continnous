export default class Validators {
  static required(value) {
    return typeof value === 'string' ? !!value.trim() : !!value;
  }
  static minLength(value, length) {
    return typeof value === 'string' && value.length >= length;
  }
  static maxLength(value, length) {
    return typeof value === 'string' && value.length <= length;
  }
  static url(value) {
    return value && typeof value === 'string' && value.match(
      /^https?:\/\/([-a-zA-Z0-9@:%._+~#=]{2,256}\.)+[a-z]{2,6}(\/[-a-zA-Z0-9@:%_+.~#?&/=]+)*$/
    );
  }
}
