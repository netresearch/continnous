let firebaseConfig;
process.argv.forEach((arg) => {
  if (arg.substr(0, 17) === '--firebase-config') {
    firebaseConfig = arg.substr(18);
  }
});
if (!firebaseConfig) {
  if (firebaseConfig === undefined) {
    console.error('Missing argument --firebase-config');
  } else {
    console.error('Invalid argument --firebase-config');
  }
  console.error('Run current command with --firebase-config=config-key');
  throw new Error('');
}

module.exports = function (source) {
  const rc = JSON.parse(source);
  if (!rc.config) {
    throw new Error('Missing config key in .firebaserc');
  }
  if (!rc.config[firebaseConfig]) {
    throw new Error('Missing config key "' + firebaseConfig + '" in .firebaserc');
  }

  this.cacheable && this.cacheable();
  this.value = [rc.config[firebaseConfig]];

  return "module.exports = " + JSON.stringify(rc.config[firebaseConfig], undefined, "\t") + ";";
};