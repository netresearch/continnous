import xhr from 'xhr';
import ConfigurationForm from './Configuration';

export default class JiraConnector {
  constructor(options) {
    this.options = options;
    this.url = options.url.replace(/^\/+$/, '');
  }
  static label = 'JIRA (Server)';
  static configurationForm = ConfigurationForm;

  get(path, options) {
    return new Promise((resolve, reject) => {
      xhr(
        this.url + '/rest/' + path,
        Object.assign({ json: true, withCredentials: true }, options),
        (error, response, body) => {
          if (error) {
            reject(error);
          } else if (response.statusCode !== 200) {
            const e = new Error(
              body && body.errorMessages ? body.errorMessages[0] : 'Unknown error'
            );
            e.response = response;
            reject(e);
          } else {
            resolve(body);
          }
        }
      );
    });
  }

  post(path, data, options) {
    return this.get(path, Object.assign({ body: data, method: 'POST' }, options));
  }

  signIn(getCredentials) {
    const path = 'auth/1/session';
    return this.get(path).catch((error) => {
      if (error.response.statusCode === 401) {
        let credentialsWrong;
        const signIn = () => getCredentials(credentialsWrong)
          .then(credentials => this.post(path, credentials))
          .catch((signInError) => {
            if (signInError.response.statusCode === 401) {
              credentialsWrong = true;
              return signIn();
            }
            throw signInError;
          });
        return signIn();
      }
      throw error;
    });
  }
}
